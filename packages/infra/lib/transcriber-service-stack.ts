import {
  CfnOutput,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpAlbIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

type TranscriberServiceStackProps = StackProps & {
  repository: ecr.IRepository;
  repositoryName: string;
  imageTag: string;
  transcriberApiKey: string;
};

export class TranscriberServiceStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: TranscriberServiceStackProps,
  ) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "TranscriberVpc", {
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const cluster = new ecs.Cluster(this, "TranscriberCluster", {
      vpc,
      clusterName: "instagram-insights-transcriber",
    });

    const logGroup = new logs.LogGroup(this, "TranscriberLogs", {
      logGroupName: "/ecs/instagram-insights-transcriber",
      retention: logs.RetentionDays.ONE_MONTH,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TranscriberTaskDefinition",
      {
        cpu: 512,
        memoryLimitMiB: 2048,
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.X86_64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      },
    );

    const container = taskDefinition.addContainer("TranscriberContainer", {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, props.imageTag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "transcriber",
        logGroup,
      }),
      environment: {
        PORT: "8000",
        TRANSCRIBER_API_KEY: props.transcriberApiKey,
        WHISPER_MODEL: "base",
        WHISPER_CACHE_DIR: "/opt/whisper-cache",
      },
    });

    container.addPortMappings({
      containerPort: 8000,
      protocol: ecs.Protocol.TCP,
    });

    const loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      "LoadBalancerSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
      },
    );

    const serviceSecurityGroup = new ec2.SecurityGroup(
      this,
      "ServiceSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
      },
    );

    serviceSecurityGroup.addIngressRule(
      loadBalancerSecurityGroup,
      ec2.Port.tcp(8000),
      "Allow ALB traffic to the transcriber container",
    );

    const service = new ecs.FargateService(this, "TranscriberService", {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      minHealthyPercent: 50,
      securityGroups: [serviceSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      serviceName: "instagram-insights-transcriber",
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      "TranscriberLoadBalancer",
      {
        vpc,
        internetFacing: false,
        securityGroup: loadBalancerSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      },
    );

    const listener = loadBalancer.addListener("HttpListener", {
      port: 80,
      open: false,
    });

    listener.addTargets("TranscriberTargets", {
      port: 8000,
      targets: [service],
      healthCheck: {
        path: "/health",
        healthyHttpCodes: "200",
        interval: Duration.seconds(30),
      },
    });

    const vpcLink = new apigwv2.VpcLink(this, "TranscriberVpcLink", {
      vpc,
      subnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const api = new apigwv2.HttpApi(this, "TranscriberHttpApi", {
      apiName: "instagram-insights-transcriber",
      createDefaultStage: true,
    });

    const integration = new HttpAlbIntegration(
      "TranscriberAlbIntegration",
      listener,
      {
        vpcLink,
      },
    );

    api.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration,
    });

    api.addRoutes({
      path: "/",
      methods: [apigwv2.HttpMethod.ANY],
      integration,
    });

    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 2,
    });

    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    new CfnOutput(this, "ApiBaseUrl", {
      value: api.apiEndpoint,
    });

    new CfnOutput(this, "RepositoryName", {
      value: props.repositoryName,
    });

    new CfnOutput(this, "ImageTag", {
      value: props.imageTag,
    });
  }
}
