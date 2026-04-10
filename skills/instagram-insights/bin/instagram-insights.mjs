#!/usr/bin/env node
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);

// ../../node_modules/reflect-metadata/Reflect.js
var require_Reflect = __commonJS({
  "../../node_modules/reflect-metadata/Reflect.js"() {
    var Reflect2;
    (function(Reflect3) {
      (function(factory) {
        var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : Function("return this;")();
        var exporter = makeExporter(Reflect3);
        if (typeof root.Reflect === "undefined") {
          root.Reflect = Reflect3;
        } else {
          exporter = makeExporter(root.Reflect, exporter);
        }
        factory(exporter);
        function makeExporter(target, previous) {
          return function(key, value) {
            if (typeof target[key] !== "function") {
              Object.defineProperty(target, key, { configurable: true, writable: true, value });
            }
            if (previous)
              previous(key, value);
          };
        }
      })(function(exporter) {
        var hasOwn = Object.prototype.hasOwnProperty;
        var supportsSymbol = typeof Symbol === "function";
        var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
        var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
        var supportsCreate = typeof Object.create === "function";
        var supportsProto = { __proto__: [] } instanceof Array;
        var downLevel = !supportsCreate && !supportsProto;
        var HashMap = {
          // create an object in dictionary mode (a.k.a. "slow" mode in v8)
          create: supportsCreate ? function() {
            return MakeDictionary(/* @__PURE__ */ Object.create(null));
          } : supportsProto ? function() {
            return MakeDictionary({ __proto__: null });
          } : function() {
            return MakeDictionary({});
          },
          has: downLevel ? function(map, key) {
            return hasOwn.call(map, key);
          } : function(map, key) {
            return key in map;
          },
          get: downLevel ? function(map, key) {
            return hasOwn.call(map, key) ? map[key] : void 0;
          } : function(map, key) {
            return map[key];
          }
        };
        var functionPrototype = Object.getPrototypeOf(Function);
        var usePolyfill = typeof process === "object" && process["env"] && process["env"]["REFLECT_METADATA_USE_MAP_POLYFILL"] === "true";
        var _Map = !usePolyfill && typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
        var _Set = !usePolyfill && typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
        var _WeakMap = !usePolyfill && typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
        var Metadata = new _WeakMap();
        function decorate(decorators, target, propertyKey, attributes) {
          if (!IsUndefined(propertyKey)) {
            if (!IsArray(decorators))
              throw new TypeError();
            if (!IsObject(target))
              throw new TypeError();
            if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
              throw new TypeError();
            if (IsNull(attributes))
              attributes = void 0;
            propertyKey = ToPropertyKey(propertyKey);
            return DecorateProperty(decorators, target, propertyKey, attributes);
          } else {
            if (!IsArray(decorators))
              throw new TypeError();
            if (!IsConstructor(target))
              throw new TypeError();
            return DecorateConstructor(decorators, target);
          }
        }
        exporter("decorate", decorate);
        function metadata(metadataKey, metadataValue) {
          function decorator(target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
              throw new TypeError();
            OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
          }
          return decorator;
        }
        exporter("metadata", metadata);
        function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
        }
        exporter("defineMetadata", defineMetadata);
        function hasMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryHasMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasMetadata", hasMetadata);
        function hasOwnMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasOwnMetadata", hasOwnMetadata);
        function getMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryGetMetadata(metadataKey, target, propertyKey);
        }
        exporter("getMetadata", getMetadata);
        function getOwnMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("getOwnMetadata", getOwnMetadata);
        function getMetadataKeys(target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryMetadataKeys(target, propertyKey);
        }
        exporter("getMetadataKeys", getMetadataKeys);
        function getOwnMetadataKeys(target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryOwnMetadataKeys(target, propertyKey);
        }
        exporter("getOwnMetadataKeys", getOwnMetadataKeys);
        function deleteMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          var metadataMap = GetOrCreateMetadataMap(
            target,
            propertyKey,
            /*Create*/
            false
          );
          if (IsUndefined(metadataMap))
            return false;
          if (!metadataMap.delete(metadataKey))
            return false;
          if (metadataMap.size > 0)
            return true;
          var targetMetadata = Metadata.get(target);
          targetMetadata.delete(propertyKey);
          if (targetMetadata.size > 0)
            return true;
          Metadata.delete(target);
          return true;
        }
        exporter("deleteMetadata", deleteMetadata);
        function DecorateConstructor(decorators, target) {
          for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
              if (!IsConstructor(decorated))
                throw new TypeError();
              target = decorated;
            }
          }
          return target;
        }
        function DecorateProperty(decorators, target, propertyKey, descriptor) {
          for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target, propertyKey, descriptor);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
              if (!IsObject(decorated))
                throw new TypeError();
              descriptor = decorated;
            }
          }
          return descriptor;
        }
        function GetOrCreateMetadataMap(O, P, Create) {
          var targetMetadata = Metadata.get(O);
          if (IsUndefined(targetMetadata)) {
            if (!Create)
              return void 0;
            targetMetadata = new _Map();
            Metadata.set(O, targetMetadata);
          }
          var metadataMap = targetMetadata.get(P);
          if (IsUndefined(metadataMap)) {
            if (!Create)
              return void 0;
            metadataMap = new _Map();
            targetMetadata.set(P, metadataMap);
          }
          return metadataMap;
        }
        function OrdinaryHasMetadata(MetadataKey, O, P) {
          var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
          if (hasOwn2)
            return true;
          var parent = OrdinaryGetPrototypeOf(O);
          if (!IsNull(parent))
            return OrdinaryHasMetadata(MetadataKey, parent, P);
          return false;
        }
        function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
          var metadataMap = GetOrCreateMetadataMap(
            O,
            P,
            /*Create*/
            false
          );
          if (IsUndefined(metadataMap))
            return false;
          return ToBoolean(metadataMap.has(MetadataKey));
        }
        function OrdinaryGetMetadata(MetadataKey, O, P) {
          var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
          if (hasOwn2)
            return OrdinaryGetOwnMetadata(MetadataKey, O, P);
          var parent = OrdinaryGetPrototypeOf(O);
          if (!IsNull(parent))
            return OrdinaryGetMetadata(MetadataKey, parent, P);
          return void 0;
        }
        function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
          var metadataMap = GetOrCreateMetadataMap(
            O,
            P,
            /*Create*/
            false
          );
          if (IsUndefined(metadataMap))
            return void 0;
          return metadataMap.get(MetadataKey);
        }
        function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
          var metadataMap = GetOrCreateMetadataMap(
            O,
            P,
            /*Create*/
            true
          );
          metadataMap.set(MetadataKey, MetadataValue);
        }
        function OrdinaryMetadataKeys(O, P) {
          var ownKeys = OrdinaryOwnMetadataKeys(O, P);
          var parent = OrdinaryGetPrototypeOf(O);
          if (parent === null)
            return ownKeys;
          var parentKeys = OrdinaryMetadataKeys(parent, P);
          if (parentKeys.length <= 0)
            return ownKeys;
          if (ownKeys.length <= 0)
            return parentKeys;
          var set = new _Set();
          var keys = [];
          for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
            var key = ownKeys_1[_i];
            var hasKey = set.has(key);
            if (!hasKey) {
              set.add(key);
              keys.push(key);
            }
          }
          for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
            var key = parentKeys_1[_a];
            var hasKey = set.has(key);
            if (!hasKey) {
              set.add(key);
              keys.push(key);
            }
          }
          return keys;
        }
        function OrdinaryOwnMetadataKeys(O, P) {
          var keys = [];
          var metadataMap = GetOrCreateMetadataMap(
            O,
            P,
            /*Create*/
            false
          );
          if (IsUndefined(metadataMap))
            return keys;
          var keysObj = metadataMap.keys();
          var iterator = GetIterator(keysObj);
          var k = 0;
          while (true) {
            var next = IteratorStep(iterator);
            if (!next) {
              keys.length = k;
              return keys;
            }
            var nextValue = IteratorValue(next);
            try {
              keys[k] = nextValue;
            } catch (e) {
              try {
                IteratorClose(iterator);
              } finally {
                throw e;
              }
            }
            k++;
          }
        }
        function Type(x) {
          if (x === null)
            return 1;
          switch (typeof x) {
            case "undefined":
              return 0;
            case "boolean":
              return 2;
            case "string":
              return 3;
            case "symbol":
              return 4;
            case "number":
              return 5;
            case "object":
              return x === null ? 1 : 6;
            default:
              return 6;
          }
        }
        function IsUndefined(x) {
          return x === void 0;
        }
        function IsNull(x) {
          return x === null;
        }
        function IsSymbol(x) {
          return typeof x === "symbol";
        }
        function IsObject(x) {
          return typeof x === "object" ? x !== null : typeof x === "function";
        }
        function ToPrimitive(input, PreferredType) {
          switch (Type(input)) {
            case 0:
              return input;
            case 1:
              return input;
            case 2:
              return input;
            case 3:
              return input;
            case 4:
              return input;
            case 5:
              return input;
          }
          var hint = PreferredType === 3 ? "string" : PreferredType === 5 ? "number" : "default";
          var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
          if (exoticToPrim !== void 0) {
            var result = exoticToPrim.call(input, hint);
            if (IsObject(result))
              throw new TypeError();
            return result;
          }
          return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
        }
        function OrdinaryToPrimitive(O, hint) {
          if (hint === "string") {
            var toString_1 = O.toString;
            if (IsCallable(toString_1)) {
              var result = toString_1.call(O);
              if (!IsObject(result))
                return result;
            }
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
              var result = valueOf.call(O);
              if (!IsObject(result))
                return result;
            }
          } else {
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
              var result = valueOf.call(O);
              if (!IsObject(result))
                return result;
            }
            var toString_2 = O.toString;
            if (IsCallable(toString_2)) {
              var result = toString_2.call(O);
              if (!IsObject(result))
                return result;
            }
          }
          throw new TypeError();
        }
        function ToBoolean(argument) {
          return !!argument;
        }
        function ToString(argument) {
          return "" + argument;
        }
        function ToPropertyKey(argument) {
          var key = ToPrimitive(
            argument,
            3
            /* String */
          );
          if (IsSymbol(key))
            return key;
          return ToString(key);
        }
        function IsArray(argument) {
          return Array.isArray ? Array.isArray(argument) : argument instanceof Object ? argument instanceof Array : Object.prototype.toString.call(argument) === "[object Array]";
        }
        function IsCallable(argument) {
          return typeof argument === "function";
        }
        function IsConstructor(argument) {
          return typeof argument === "function";
        }
        function IsPropertyKey(argument) {
          switch (Type(argument)) {
            case 3:
              return true;
            case 4:
              return true;
            default:
              return false;
          }
        }
        function GetMethod(V, P) {
          var func = V[P];
          if (func === void 0 || func === null)
            return void 0;
          if (!IsCallable(func))
            throw new TypeError();
          return func;
        }
        function GetIterator(obj) {
          var method = GetMethod(obj, iteratorSymbol);
          if (!IsCallable(method))
            throw new TypeError();
          var iterator = method.call(obj);
          if (!IsObject(iterator))
            throw new TypeError();
          return iterator;
        }
        function IteratorValue(iterResult) {
          return iterResult.value;
        }
        function IteratorStep(iterator) {
          var result = iterator.next();
          return result.done ? false : result;
        }
        function IteratorClose(iterator) {
          var f = iterator["return"];
          if (f)
            f.call(iterator);
        }
        function OrdinaryGetPrototypeOf(O) {
          var proto = Object.getPrototypeOf(O);
          if (typeof O !== "function" || O === functionPrototype)
            return proto;
          if (proto !== functionPrototype)
            return proto;
          var prototype = O.prototype;
          var prototypeProto = prototype && Object.getPrototypeOf(prototype);
          if (prototypeProto == null || prototypeProto === Object.prototype)
            return proto;
          var constructor = prototypeProto.constructor;
          if (typeof constructor !== "function")
            return proto;
          if (constructor === O)
            return proto;
          return constructor;
        }
        function CreateMapPolyfill() {
          var cacheSentinel = {};
          var arraySentinel = [];
          var MapIterator = (
            /** @class */
            (function() {
              function MapIterator2(keys, values, selector) {
                this._index = 0;
                this._keys = keys;
                this._values = values;
                this._selector = selector;
              }
              MapIterator2.prototype["@@iterator"] = function() {
                return this;
              };
              MapIterator2.prototype[iteratorSymbol] = function() {
                return this;
              };
              MapIterator2.prototype.next = function() {
                var index = this._index;
                if (index >= 0 && index < this._keys.length) {
                  var result = this._selector(this._keys[index], this._values[index]);
                  if (index + 1 >= this._keys.length) {
                    this._index = -1;
                    this._keys = arraySentinel;
                    this._values = arraySentinel;
                  } else {
                    this._index++;
                  }
                  return { value: result, done: false };
                }
                return { value: void 0, done: true };
              };
              MapIterator2.prototype.throw = function(error) {
                if (this._index >= 0) {
                  this._index = -1;
                  this._keys = arraySentinel;
                  this._values = arraySentinel;
                }
                throw error;
              };
              MapIterator2.prototype.return = function(value) {
                if (this._index >= 0) {
                  this._index = -1;
                  this._keys = arraySentinel;
                  this._values = arraySentinel;
                }
                return { value, done: true };
              };
              return MapIterator2;
            })()
          );
          return (
            /** @class */
            (function() {
              function Map2() {
                this._keys = [];
                this._values = [];
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
              }
              Object.defineProperty(Map2.prototype, "size", {
                get: function() {
                  return this._keys.length;
                },
                enumerable: true,
                configurable: true
              });
              Map2.prototype.has = function(key) {
                return this._find(
                  key,
                  /*insert*/
                  false
                ) >= 0;
              };
              Map2.prototype.get = function(key) {
                var index = this._find(
                  key,
                  /*insert*/
                  false
                );
                return index >= 0 ? this._values[index] : void 0;
              };
              Map2.prototype.set = function(key, value) {
                var index = this._find(
                  key,
                  /*insert*/
                  true
                );
                this._values[index] = value;
                return this;
              };
              Map2.prototype.delete = function(key) {
                var index = this._find(
                  key,
                  /*insert*/
                  false
                );
                if (index >= 0) {
                  var size = this._keys.length;
                  for (var i = index + 1; i < size; i++) {
                    this._keys[i - 1] = this._keys[i];
                    this._values[i - 1] = this._values[i];
                  }
                  this._keys.length--;
                  this._values.length--;
                  if (key === this._cacheKey) {
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                  }
                  return true;
                }
                return false;
              };
              Map2.prototype.clear = function() {
                this._keys.length = 0;
                this._values.length = 0;
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
              };
              Map2.prototype.keys = function() {
                return new MapIterator(this._keys, this._values, getKey);
              };
              Map2.prototype.values = function() {
                return new MapIterator(this._keys, this._values, getValue);
              };
              Map2.prototype.entries = function() {
                return new MapIterator(this._keys, this._values, getEntry);
              };
              Map2.prototype["@@iterator"] = function() {
                return this.entries();
              };
              Map2.prototype[iteratorSymbol] = function() {
                return this.entries();
              };
              Map2.prototype._find = function(key, insert) {
                if (this._cacheKey !== key) {
                  this._cacheIndex = this._keys.indexOf(this._cacheKey = key);
                }
                if (this._cacheIndex < 0 && insert) {
                  this._cacheIndex = this._keys.length;
                  this._keys.push(key);
                  this._values.push(void 0);
                }
                return this._cacheIndex;
              };
              return Map2;
            })()
          );
          function getKey(key, _) {
            return key;
          }
          function getValue(_, value) {
            return value;
          }
          function getEntry(key, value) {
            return [key, value];
          }
        }
        function CreateSetPolyfill() {
          return (
            /** @class */
            (function() {
              function Set2() {
                this._map = new _Map();
              }
              Object.defineProperty(Set2.prototype, "size", {
                get: function() {
                  return this._map.size;
                },
                enumerable: true,
                configurable: true
              });
              Set2.prototype.has = function(value) {
                return this._map.has(value);
              };
              Set2.prototype.add = function(value) {
                return this._map.set(value, value), this;
              };
              Set2.prototype.delete = function(value) {
                return this._map.delete(value);
              };
              Set2.prototype.clear = function() {
                this._map.clear();
              };
              Set2.prototype.keys = function() {
                return this._map.keys();
              };
              Set2.prototype.values = function() {
                return this._map.values();
              };
              Set2.prototype.entries = function() {
                return this._map.entries();
              };
              Set2.prototype["@@iterator"] = function() {
                return this.keys();
              };
              Set2.prototype[iteratorSymbol] = function() {
                return this.keys();
              };
              return Set2;
            })()
          );
        }
        function CreateWeakMapPolyfill() {
          var UUID_SIZE = 16;
          var keys = HashMap.create();
          var rootKey = CreateUniqueKey();
          return (
            /** @class */
            (function() {
              function WeakMap2() {
                this._key = CreateUniqueKey();
              }
              WeakMap2.prototype.has = function(target) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  false
                );
                return table !== void 0 ? HashMap.has(table, this._key) : false;
              };
              WeakMap2.prototype.get = function(target) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  false
                );
                return table !== void 0 ? HashMap.get(table, this._key) : void 0;
              };
              WeakMap2.prototype.set = function(target, value) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  true
                );
                table[this._key] = value;
                return this;
              };
              WeakMap2.prototype.delete = function(target) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  false
                );
                return table !== void 0 ? delete table[this._key] : false;
              };
              WeakMap2.prototype.clear = function() {
                this._key = CreateUniqueKey();
              };
              return WeakMap2;
            })()
          );
          function CreateUniqueKey() {
            var key;
            do
              key = "@@WeakMap@@" + CreateUUID();
            while (HashMap.has(keys, key));
            keys[key] = true;
            return key;
          }
          function GetOrCreateWeakMapTable(target, create) {
            if (!hasOwn.call(target, rootKey)) {
              if (!create)
                return void 0;
              Object.defineProperty(target, rootKey, { value: HashMap.create() });
            }
            return target[rootKey];
          }
          function FillRandomBytes(buffer, size) {
            for (var i = 0; i < size; ++i)
              buffer[i] = Math.random() * 255 | 0;
            return buffer;
          }
          function GenRandomBytes(size) {
            if (typeof Uint8Array === "function") {
              if (typeof crypto !== "undefined")
                return crypto.getRandomValues(new Uint8Array(size));
              if (typeof msCrypto !== "undefined")
                return msCrypto.getRandomValues(new Uint8Array(size));
              return FillRandomBytes(new Uint8Array(size), size);
            }
            return FillRandomBytes(new Array(size), size);
          }
          function CreateUUID() {
            var data = GenRandomBytes(UUID_SIZE);
            data[6] = data[6] & 79 | 64;
            data[8] = data[8] & 191 | 128;
            var result = "";
            for (var offset = 0; offset < UUID_SIZE; ++offset) {
              var byte = data[offset];
              if (offset === 4 || offset === 6 || offset === 8)
                result += "-";
              if (byte < 16)
                result += "0";
              result += byte.toString(16).toLowerCase();
            }
            return result;
          }
        }
        function MakeDictionary(obj) {
          obj.__ = void 0;
          delete obj.__;
          return obj;
        }
      });
    })(Reflect2 || (Reflect2 = {}));
  }
});

// ../../node_modules/commander/index.js
var require_commander = __commonJS({
  "../../node_modules/commander/index.js"(exports, module) {
    var EventEmitter = __require("events").EventEmitter;
    var childProcess = __require("child_process");
    var path5 = __require("path");
    var fs = __require("fs");
    var Help = class {
      constructor() {
        this.helpWidth = void 0;
        this.sortSubcommands = false;
        this.sortOptions = false;
      }
      /**
       * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
       *
       * @param {Command} cmd
       * @returns {Command[]}
       */
      visibleCommands(cmd) {
        const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
        if (cmd._hasImplicitHelpCommand()) {
          const args = cmd._helpCommandnameAndArgs.split(/ +/);
          const helpCommand = cmd.createCommand(args.shift()).helpOption(false);
          helpCommand.description(cmd._helpCommandDescription);
          helpCommand._parseExpectedArgs(args);
          visibleCommands.push(helpCommand);
        }
        if (this.sortSubcommands) {
          visibleCommands.sort((a, b) => {
            return a.name().localeCompare(b.name());
          });
        }
        return visibleCommands;
      }
      /**
       * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleOptions(cmd) {
        const visibleOptions = cmd.options.filter((option2) => !option2.hidden);
        const showShortHelpFlag = cmd._hasHelpOption && cmd._helpShortFlag && !cmd._findOption(cmd._helpShortFlag);
        const showLongHelpFlag = cmd._hasHelpOption && !cmd._findOption(cmd._helpLongFlag);
        if (showShortHelpFlag || showLongHelpFlag) {
          let helpOption;
          if (!showShortHelpFlag) {
            helpOption = cmd.createOption(cmd._helpLongFlag, cmd._helpDescription);
          } else if (!showLongHelpFlag) {
            helpOption = cmd.createOption(cmd._helpShortFlag, cmd._helpDescription);
          } else {
            helpOption = cmd.createOption(cmd._helpFlags, cmd._helpDescription);
          }
          visibleOptions.push(helpOption);
        }
        if (this.sortOptions) {
          const getSortKey = (option2) => {
            return option2.short ? option2.short.replace(/^-/, "") : option2.long.replace(/^--/, "");
          };
          visibleOptions.sort((a, b) => {
            return getSortKey(a).localeCompare(getSortKey(b));
          });
        }
        return visibleOptions;
      }
      /**
       * Get an array of the arguments which have descriptions.
       *
       * @param {Command} cmd
       * @returns {{ term: string, description:string }[]}
       */
      visibleArguments(cmd) {
        if (cmd._argsDescription && cmd._args.length) {
          return cmd._args.map((argument) => {
            return { term: argument.name, description: cmd._argsDescription[argument.name] || "" };
          }, 0);
        }
        return [];
      }
      /**
       * Get the command term to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandTerm(cmd) {
        const args = cmd._args.map((arg) => humanReadableArgName(arg)).join(" ");
        return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
        (args ? " " + args : "");
      }
      /**
       * Get the option term to show in the list of options.
       *
       * @param {Option} option
       * @returns {string}
       */
      optionTerm(option2) {
        return option2.flags;
      }
      /**
       * Get the longest command term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestSubcommandTermLength(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command2) => {
          return Math.max(max, helper.subcommandTerm(command2).length);
        }, 0);
      }
      /**
       * Get the longest option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestOptionTermLength(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option2) => {
          return Math.max(max, helper.optionTerm(option2).length);
        }, 0);
      }
      /**
       * Get the longest argument term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestArgumentTermLength(cmd, helper) {
        return helper.visibleArguments(cmd).reduce((max, argument) => {
          return Math.max(max, argument.term.length);
        }, 0);
      }
      /**
       * Get the command usage to be displayed at the top of the built-in help.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandUsage(cmd) {
        let cmdName = cmd._name;
        if (cmd._aliases[0]) {
          cmdName = cmdName + "|" + cmd._aliases[0];
        }
        let parentCmdNames = "";
        for (let parentCmd = cmd.parent; parentCmd; parentCmd = parentCmd.parent) {
          parentCmdNames = parentCmd.name() + " " + parentCmdNames;
        }
        return parentCmdNames + cmdName + " " + cmd.usage();
      }
      /**
       * Get the description for the command.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the command description to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the option description to show in the list of options.
       *
       * @param {Option} option
       * @return {string}
       */
      optionDescription(option2) {
        if (option2.negate) {
          return option2.description;
        }
        const extraInfo = [];
        if (option2.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${option2.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (option2.defaultValue !== void 0) {
          extraInfo.push(`default: ${option2.defaultValueDescription || JSON.stringify(option2.defaultValue)}`);
        }
        if (extraInfo.length > 0) {
          return `${option2.description} (${extraInfo.join(", ")})`;
        }
        return option2.description;
      }
      /**
       * Generate the built-in help text.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {string}
       */
      formatHelp(cmd, helper) {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth || 80;
        const itemIndentWidth = 2;
        const itemSeparatorWidth = 2;
        function formatItem(term, description2) {
          if (description2) {
            const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description2}`;
            return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth);
          }
          return term;
        }
        ;
        function formatList(textArray) {
          return textArray.join("\n").replace(/^/gm, " ".repeat(itemIndentWidth));
        }
        let output = [`Usage: ${helper.commandUsage(cmd)}`, ""];
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
          output = output.concat([commandDescription, ""]);
        }
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
          return formatItem(argument.term, argument.description);
        });
        if (argumentList.length > 0) {
          output = output.concat(["Arguments:", formatList(argumentList), ""]);
        }
        const optionList = helper.visibleOptions(cmd).map((option2) => {
          return formatItem(helper.optionTerm(option2), helper.optionDescription(option2));
        });
        if (optionList.length > 0) {
          output = output.concat(["Options:", formatList(optionList), ""]);
        }
        const commandList = helper.visibleCommands(cmd).map((cmd2) => {
          return formatItem(helper.subcommandTerm(cmd2), helper.subcommandDescription(cmd2));
        });
        if (commandList.length > 0) {
          output = output.concat(["Commands:", formatList(commandList), ""]);
        }
        return output.join("\n");
      }
      /**
       * Calculate the pad width from the maximum term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      padWidth(cmd, helper) {
        return Math.max(
          helper.longestOptionTermLength(cmd, helper),
          helper.longestSubcommandTermLength(cmd, helper),
          helper.longestArgumentTermLength(cmd, helper)
        );
      }
      /**
       * Wrap the given string to width characters per line, with lines after the first indented.
       * Do not wrap if insufficient room for wrapping (minColumnWidth), or string is manually formatted.
       *
       * @param {string} str
       * @param {number} width
       * @param {number} indent
       * @param {number} [minColumnWidth=40]
       * @return {string}
       *
       */
      wrap(str, width, indent, minColumnWidth = 40) {
        if (str.match(/[\n]\s+/)) return str;
        const columnWidth = width - indent;
        if (columnWidth < minColumnWidth) return str;
        const leadingStr = str.substr(0, indent);
        const columnText = str.substr(indent);
        const indentString = " ".repeat(indent);
        const regex = new RegExp(".{1," + (columnWidth - 1) + "}([\\s\u200B]|$)|[^\\s\u200B]+?([\\s\u200B]|$)", "g");
        const lines = columnText.match(regex) || [];
        return leadingStr + lines.map((line, i) => {
          if (line.slice(-1) === "\n") {
            line = line.slice(0, line.length - 1);
          }
          return (i > 0 ? indentString : "") + line.trimRight();
        }).join("\n");
      }
    };
    var Option = class {
      /**
       * Initialize a new `Option` with the given `flags` and `description`.
       *
       * @param {string} flags
       * @param {string} [description]
       */
      constructor(flags, description2) {
        this.flags = flags;
        this.description = description2 || "";
        this.required = flags.includes("<");
        this.optional = flags.includes("[");
        this.variadic = /\w\.\.\.[>\]]$/.test(flags);
        this.mandatory = false;
        const optionFlags = _parseOptionFlags(flags);
        this.short = optionFlags.shortFlag;
        this.long = optionFlags.longFlag;
        this.negate = false;
        if (this.long) {
          this.negate = this.long.startsWith("--no-");
        }
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.parseArg = void 0;
        this.hidden = false;
        this.argChoices = void 0;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {any} value
       * @param {string} [description]
       * @return {Option}
       */
      default(value, description2) {
        this.defaultValue = value;
        this.defaultValueDescription = description2;
        return this;
      }
      /**
       * Set the custom handler for processing CLI option arguments into option values.
       *
       * @param {Function} [fn]
       * @return {Option}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Whether the option is mandatory and must have a value after parsing.
       *
       * @param {boolean} [mandatory=true]
       * @return {Option}
       */
      makeOptionMandatory(mandatory = true) {
        this.mandatory = !!mandatory;
        return this;
      }
      /**
       * Hide option in help.
       *
       * @param {boolean} [hide=true]
       * @return {Option}
       */
      hideHelp(hide = true) {
        this.hidden = !!hide;
        return this;
      }
      /**
       * @api private
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Only allow option value to be one of choices.
       *
       * @param {string[]} values
       * @return {Option}
       */
      choices(values) {
        this.argChoices = values;
        this.parseArg = (arg, previous) => {
          if (!values.includes(arg)) {
            throw new InvalidOptionArgumentError(`Allowed choices are ${values.join(", ")}.`);
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Return option name.
       *
       * @return {string}
       */
      name() {
        if (this.long) {
          return this.long.replace(/^--/, "");
        }
        return this.short.replace(/^-/, "");
      }
      /**
       * Return option name, in a camelcase format that can be used
       * as a object attribute key.
       *
       * @return {string}
       * @api private
       */
      attributeName() {
        return camelcase(this.name().replace(/^no-/, ""));
      }
      /**
       * Check if `arg` matches the short or long flag.
       *
       * @param {string} arg
       * @return {boolean}
       * @api private
       */
      is(arg) {
        return this.short === arg || this.long === arg;
      }
    };
    var CommanderError = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {number} exitCode suggested exit code which could be used with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @constructor
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
        this.nestedError = void 0;
      }
    };
    var InvalidOptionArgumentError = class extends CommanderError {
      /**
       * Constructs the InvalidOptionArgumentError class
       * @param {string} [message] explanation of why argument is invalid
       * @constructor
       */
      constructor(message) {
        super(1, "commander.invalidOptionArgument", message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }
    };
    var Command = class _Command extends EventEmitter {
      /**
       * Initialize a new `Command`.
       *
       * @param {string} [name]
       */
      constructor(name) {
        super();
        this.commands = [];
        this.options = [];
        this.parent = null;
        this._allowUnknownOption = false;
        this._allowExcessArguments = true;
        this._args = [];
        this.rawArgs = null;
        this._scriptPath = null;
        this._name = name || "";
        this._optionValues = {};
        this._storeOptionsAsProperties = false;
        this._actionResults = [];
        this._actionHandler = null;
        this._executableHandler = false;
        this._executableFile = null;
        this._defaultCommandName = null;
        this._exitCallback = null;
        this._aliases = [];
        this._combineFlagAndOptionalValue = true;
        this._description = "";
        this._argsDescription = void 0;
        this._enablePositionalOptions = false;
        this._passThroughOptions = false;
        this._outputConfiguration = {
          writeOut: (str) => process.stdout.write(str),
          writeErr: (str) => process.stderr.write(str),
          getOutHelpWidth: () => process.stdout.isTTY ? process.stdout.columns : void 0,
          getErrHelpWidth: () => process.stderr.isTTY ? process.stderr.columns : void 0,
          outputError: (str, write) => write(str)
        };
        this._hidden = false;
        this._hasHelpOption = true;
        this._helpFlags = "-h, --help";
        this._helpDescription = "display help for command";
        this._helpShortFlag = "-h";
        this._helpLongFlag = "--help";
        this._addImplicitHelpCommand = void 0;
        this._helpCommandName = "help";
        this._helpCommandnameAndArgs = "help [command]";
        this._helpCommandDescription = "display help for command";
        this._helpConfiguration = {};
      }
      /**
       * Define a command.
       *
       * There are two styles of command: pay attention to where to put the description.
       *
       * Examples:
       *
       *      // Command implemented using action handler (description is supplied separately to `.command`)
       *      program
       *        .command('clone <source> [destination]')
       *        .description('clone a repository into a newly created directory')
       *        .action((source, destination) => {
       *          console.log('clone command called');
       *        });
       *
       *      // Command implemented using separate executable file (description is second parameter to `.command`)
       *      program
       *        .command('start <service>', 'start named service')
       *        .command('stop [service]', 'stop named service, or all if no name supplied');
       *
       * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
       * @param {Object|string} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
       * @param {Object} [execOpts] - configuration options (for executable)
       * @return {Command} returns new command for action handler, or `this` for executable command
       */
      command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
        let desc = actionOptsOrExecDesc;
        let opts = execOpts;
        if (typeof desc === "object" && desc !== null) {
          opts = desc;
          desc = null;
        }
        opts = opts || {};
        const args = nameAndArgs.split(/ +/);
        const cmd = this.createCommand(args.shift());
        if (desc) {
          cmd.description(desc);
          cmd._executableHandler = true;
        }
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        cmd._outputConfiguration = this._outputConfiguration;
        cmd._hidden = !!(opts.noHelp || opts.hidden);
        cmd._hasHelpOption = this._hasHelpOption;
        cmd._helpFlags = this._helpFlags;
        cmd._helpDescription = this._helpDescription;
        cmd._helpShortFlag = this._helpShortFlag;
        cmd._helpLongFlag = this._helpLongFlag;
        cmd._helpCommandName = this._helpCommandName;
        cmd._helpCommandnameAndArgs = this._helpCommandnameAndArgs;
        cmd._helpCommandDescription = this._helpCommandDescription;
        cmd._helpConfiguration = this._helpConfiguration;
        cmd._exitCallback = this._exitCallback;
        cmd._storeOptionsAsProperties = this._storeOptionsAsProperties;
        cmd._combineFlagAndOptionalValue = this._combineFlagAndOptionalValue;
        cmd._allowExcessArguments = this._allowExcessArguments;
        cmd._enablePositionalOptions = this._enablePositionalOptions;
        cmd._executableFile = opts.executableFile || null;
        this.commands.push(cmd);
        cmd._parseExpectedArgs(args);
        cmd.parent = this;
        if (desc) return this;
        return cmd;
      }
      /**
       * Factory routine to create a new unattached command.
       *
       * See .command() for creating an attached subcommand, which uses this routine to
       * create the command. You can override createCommand to customise subcommands.
       *
       * @param {string} [name]
       * @return {Command} new command
       */
      createCommand(name) {
        return new _Command(name);
      }
      /**
       * You can customise the help with a subclass of Help by overriding createHelp,
       * or by overriding Help properties using configureHelp().
       *
       * @return {Help}
       */
      createHelp() {
        return Object.assign(new Help(), this.configureHelp());
      }
      /**
       * You can customise the help by overriding Help properties using configureHelp(),
       * or with a subclass of Help by overriding createHelp().
       *
       * @param {Object} [configuration] - configuration options
       * @return {Command|Object} `this` command for chaining, or stored configuration
       */
      configureHelp(configuration) {
        if (configuration === void 0) return this._helpConfiguration;
        this._helpConfiguration = configuration;
        return this;
      }
      /**
       * The default output goes to stdout and stderr. You can customise this for special
       * applications. You can also customise the display of errors by overriding outputError.
       *
       * The configuration properties are all functions:
       *
       *    // functions to change where being written, stdout and stderr
       *    writeOut(str)
       *    writeErr(str)
       *    // matching functions to specify width for wrapping help
       *    getOutHelpWidth()
       *    getErrHelpWidth()
       *    // functions based on what is being written out
       *    outputError(str, write) // used for displaying errors, and not used for displaying help
       *
       * @param {Object} [configuration] - configuration options
       * @return {Command|Object} `this` command for chaining, or stored configuration
       */
      configureOutput(configuration) {
        if (configuration === void 0) return this._outputConfiguration;
        Object.assign(this._outputConfiguration, configuration);
        return this;
      }
      /**
       * Add a prepared subcommand.
       *
       * See .command() for creating an attached subcommand which inherits settings from its parent.
       *
       * @param {Command} cmd - new subcommand
       * @param {Object} [opts] - configuration options
       * @return {Command} `this` command for chaining
       */
      addCommand(cmd, opts) {
        if (!cmd._name) throw new Error("Command passed to .addCommand() must have a name");
        function checkExplicitNames(commandArray) {
          commandArray.forEach((cmd2) => {
            if (cmd2._executableHandler && !cmd2._executableFile) {
              throw new Error(`Must specify executableFile for deeply nested executable: ${cmd2.name()}`);
            }
            checkExplicitNames(cmd2.commands);
          });
        }
        checkExplicitNames(cmd.commands);
        opts = opts || {};
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        if (opts.noHelp || opts.hidden) cmd._hidden = true;
        this.commands.push(cmd);
        cmd.parent = this;
        return this;
      }
      /**
       * Define argument syntax for the command.
       */
      arguments(desc) {
        return this._parseExpectedArgs(desc.split(/ +/));
      }
      /**
       * Override default decision whether to add implicit help command.
       *
       *    addHelpCommand() // force on
       *    addHelpCommand(false); // force off
       *    addHelpCommand('help [cmd]', 'display help for [cmd]'); // force on with custom details
       *
       * @return {Command} `this` command for chaining
       */
      addHelpCommand(enableOrNameAndArgs, description2) {
        if (enableOrNameAndArgs === false) {
          this._addImplicitHelpCommand = false;
        } else {
          this._addImplicitHelpCommand = true;
          if (typeof enableOrNameAndArgs === "string") {
            this._helpCommandName = enableOrNameAndArgs.split(" ")[0];
            this._helpCommandnameAndArgs = enableOrNameAndArgs;
          }
          this._helpCommandDescription = description2 || this._helpCommandDescription;
        }
        return this;
      }
      /**
       * @return {boolean}
       * @api private
       */
      _hasImplicitHelpCommand() {
        if (this._addImplicitHelpCommand === void 0) {
          return this.commands.length && !this._actionHandler && !this._findCommand("help");
        }
        return this._addImplicitHelpCommand;
      }
      /**
       * Parse expected `args`.
       *
       * For example `["[type]"]` becomes `[{ required: false, name: 'type' }]`.
       *
       * @param {Array} args
       * @return {Command} `this` command for chaining
       * @api private
       */
      _parseExpectedArgs(args) {
        if (!args.length) return;
        args.forEach((arg) => {
          const argDetails = {
            required: false,
            name: "",
            variadic: false
          };
          switch (arg[0]) {
            case "<":
              argDetails.required = true;
              argDetails.name = arg.slice(1, -1);
              break;
            case "[":
              argDetails.name = arg.slice(1, -1);
              break;
          }
          if (argDetails.name.length > 3 && argDetails.name.slice(-3) === "...") {
            argDetails.variadic = true;
            argDetails.name = argDetails.name.slice(0, -3);
          }
          if (argDetails.name) {
            this._args.push(argDetails);
          }
        });
        this._args.forEach((arg, i) => {
          if (arg.variadic && i < this._args.length - 1) {
            throw new Error(`only the last argument can be variadic '${arg.name}'`);
          }
        });
        return this;
      }
      /**
       * Register callback to use as replacement for calling process.exit.
       *
       * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
       * @return {Command} `this` command for chaining
       */
      exitOverride(fn) {
        if (fn) {
          this._exitCallback = fn;
        } else {
          this._exitCallback = (err) => {
            if (err.code !== "commander.executeSubCommandAsync") {
              throw err;
            } else {
            }
          };
        }
        return this;
      }
      /**
       * Call process.exit, and _exitCallback if defined.
       *
       * @param {number} exitCode exit code for using with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @return never
       * @api private
       */
      _exit(exitCode, code, message) {
        if (this._exitCallback) {
          this._exitCallback(new CommanderError(exitCode, code, message));
        }
        process.exit(exitCode);
      }
      /**
       * Register callback `fn` for the command.
       *
       * Examples:
       *
       *      program
       *        .command('help')
       *        .description('display verbose help')
       *        .action(function() {
       *           // output help here
       *        });
       *
       * @param {Function} fn
       * @return {Command} `this` command for chaining
       */
      action(fn) {
        const listener = (args) => {
          const expectedArgsCount = this._args.length;
          const actionArgs = args.slice(0, expectedArgsCount);
          if (this._storeOptionsAsProperties) {
            actionArgs[expectedArgsCount] = this;
          } else {
            actionArgs[expectedArgsCount] = this.opts();
          }
          actionArgs.push(this);
          const actionResult = fn.apply(this, actionArgs);
          let rootCommand = this;
          while (rootCommand.parent) {
            rootCommand = rootCommand.parent;
          }
          rootCommand._actionResults.push(actionResult);
        };
        this._actionHandler = listener;
        return this;
      }
      /**
       * Factory routine to create a new unattached option.
       *
       * See .option() for creating an attached option, which uses this routine to
       * create the option. You can override createOption to return a custom option.
       *
       * @param {string} flags
       * @param {string} [description]
       * @return {Option} new option
       */
      createOption(flags, description2) {
        return new Option(flags, description2);
      }
      /**
       * Add an option.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addOption(option2) {
        const oname = option2.name();
        const name = option2.attributeName();
        let defaultValue = option2.defaultValue;
        if (option2.negate || option2.optional || option2.required || typeof defaultValue === "boolean") {
          if (option2.negate) {
            const positiveLongFlag = option2.long.replace(/^--no-/, "--");
            defaultValue = this._findOption(positiveLongFlag) ? this._getOptionValue(name) : true;
          }
          if (defaultValue !== void 0) {
            this._setOptionValue(name, defaultValue);
          }
        }
        this.options.push(option2);
        this.on("option:" + oname, (val) => {
          const oldValue = this._getOptionValue(name);
          if (val !== null && option2.parseArg) {
            try {
              val = option2.parseArg(val, oldValue === void 0 ? defaultValue : oldValue);
            } catch (err) {
              if (err.code === "commander.invalidOptionArgument") {
                const message = `error: option '${option2.flags}' argument '${val}' is invalid. ${err.message}`;
                this._displayError(err.exitCode, err.code, message);
              }
              throw err;
            }
          } else if (val !== null && option2.variadic) {
            val = option2._concatValue(val, oldValue);
          }
          if (typeof oldValue === "boolean" || typeof oldValue === "undefined") {
            if (val == null) {
              this._setOptionValue(name, option2.negate ? false : defaultValue || true);
            } else {
              this._setOptionValue(name, val);
            }
          } else if (val !== null) {
            this._setOptionValue(name, option2.negate ? false : val);
          }
        });
        return this;
      }
      /**
       * Internal implementation shared by .option() and .requiredOption()
       *
       * @api private
       */
      _optionEx(config, flags, description2, fn, defaultValue) {
        const option2 = this.createOption(flags, description2);
        option2.makeOptionMandatory(!!config.mandatory);
        if (typeof fn === "function") {
          option2.default(defaultValue).argParser(fn);
        } else if (fn instanceof RegExp) {
          const regex = fn;
          fn = (val, def) => {
            const m = regex.exec(val);
            return m ? m[0] : def;
          };
          option2.default(defaultValue).argParser(fn);
        } else {
          option2.default(fn);
        }
        return this.addOption(option2);
      }
      /**
       * Define option with `flags`, `description` and optional
       * coercion `fn`.
       *
       * The `flags` string contains the short and/or long flags,
       * separated by comma, a pipe or space. The following are all valid
       * all will output this way when `--help` is used.
       *
       *    "-p, --pepper"
       *    "-p|--pepper"
       *    "-p --pepper"
       *
       * Examples:
       *
       *     // simple boolean defaulting to undefined
       *     program.option('-p, --pepper', 'add pepper');
       *
       *     program.pepper
       *     // => undefined
       *
       *     --pepper
       *     program.pepper
       *     // => true
       *
       *     // simple boolean defaulting to true (unless non-negated option is also defined)
       *     program.option('-C, --no-cheese', 'remove cheese');
       *
       *     program.cheese
       *     // => true
       *
       *     --no-cheese
       *     program.cheese
       *     // => false
       *
       *     // required argument
       *     program.option('-C, --chdir <path>', 'change the working directory');
       *
       *     --chdir /tmp
       *     program.chdir
       *     // => "/tmp"
       *
       *     // optional argument
       *     program.option('-c, --cheese [type]', 'add cheese [marble]');
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {Function|*} [fn] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      option(flags, description2, fn, defaultValue) {
        return this._optionEx({}, flags, description2, fn, defaultValue);
      }
      /**
      * Add a required option which must have a value after parsing. This usually means
      * the option must be specified on the command line. (Otherwise the same as .option().)
      *
      * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
      *
      * @param {string} flags
      * @param {string} [description]
      * @param {Function|*} [fn] - custom option processing function or default value
      * @param {*} [defaultValue]
      * @return {Command} `this` command for chaining
      */
      requiredOption(flags, description2, fn, defaultValue) {
        return this._optionEx({ mandatory: true }, flags, description2, fn, defaultValue);
      }
      /**
       * Alter parsing of short flags with optional values.
       *
       * Examples:
       *
       *    // for `.option('-f,--flag [value]'):
       *    .combineFlagAndOptionalValue(true)  // `-f80` is treated like `--flag=80`, this is the default behaviour
       *    .combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
       *
       * @param {Boolean} [combine=true] - if `true` or omitted, an optional value can be specified directly after the flag.
       */
      combineFlagAndOptionalValue(combine = true) {
        this._combineFlagAndOptionalValue = !!combine;
        return this;
      }
      /**
       * Allow unknown options on the command line.
       *
       * @param {Boolean} [allowUnknown=true] - if `true` or omitted, no error will be thrown
       * for unknown options.
       */
      allowUnknownOption(allowUnknown = true) {
        this._allowUnknownOption = !!allowUnknown;
        return this;
      }
      /**
       * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
       *
       * @param {Boolean} [allowExcess=true] - if `true` or omitted, no error will be thrown
       * for excess arguments.
       */
      allowExcessArguments(allowExcess = true) {
        this._allowExcessArguments = !!allowExcess;
        return this;
      }
      /**
       * Enable positional options. Positional means global options are specified before subcommands which lets
       * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
       * The default behaviour is non-positional and global options may appear anywhere on the command line.
       *
       * @param {Boolean} [positional=true]
       */
      enablePositionalOptions(positional = true) {
        this._enablePositionalOptions = !!positional;
        return this;
      }
      /**
       * Pass through options that come after command-arguments rather than treat them as command-options,
       * so actual command-options come before command-arguments. Turning this on for a subcommand requires
       * positional options to have been enabled on the program (parent commands).
       * The default behaviour is non-positional and options may appear before or after command-arguments.
       *
       * @param {Boolean} [passThrough=true]
       * for unknown options.
       */
      passThroughOptions(passThrough = true) {
        this._passThroughOptions = !!passThrough;
        if (!!this.parent && passThrough && !this.parent._enablePositionalOptions) {
          throw new Error("passThroughOptions can not be used without turning on enablePositionalOptions for parent command(s)");
        }
        return this;
      }
      /**
        * Whether to store option values as properties on command object,
        * or store separately (specify false). In both cases the option values can be accessed using .opts().
        *
        * @param {boolean} [storeAsProperties=true]
        * @return {Command} `this` command for chaining
        */
      storeOptionsAsProperties(storeAsProperties = true) {
        this._storeOptionsAsProperties = !!storeAsProperties;
        if (this.options.length) {
          throw new Error("call .storeOptionsAsProperties() before adding options");
        }
        return this;
      }
      /**
       * Store option value
       *
       * @param {string} key
       * @param {Object} value
       * @api private
       */
      _setOptionValue(key, value) {
        if (this._storeOptionsAsProperties) {
          this[key] = value;
        } else {
          this._optionValues[key] = value;
        }
      }
      /**
       * Retrieve option value
       *
       * @param {string} key
       * @return {Object} value
       * @api private
       */
      _getOptionValue(key) {
        if (this._storeOptionsAsProperties) {
          return this[key];
        }
        return this._optionValues[key];
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * The default expectation is that the arguments are from node and have the application as argv[0]
       * and the script being run in argv[1], with user parameters after that.
       *
       * Examples:
       *
       *      program.parse(process.argv);
       *      program.parse(); // implicitly use process.argv and auto-detect node vs electron conventions
       *      program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv] - optional, defaults to process.argv
       * @param {Object} [parseOptions] - optionally specify style of options with from: node/user/electron
       * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
       * @return {Command} `this` command for chaining
       */
      parse(argv, parseOptions) {
        if (argv !== void 0 && !Array.isArray(argv)) {
          throw new Error("first parameter to parse must be array or undefined");
        }
        parseOptions = parseOptions || {};
        if (argv === void 0) {
          argv = process.argv;
          if (process.versions && process.versions.electron) {
            parseOptions.from = "electron";
          }
        }
        this.rawArgs = argv.slice();
        let userArgs;
        switch (parseOptions.from) {
          case void 0:
          case "node":
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
            break;
          case "electron":
            if (process.defaultApp) {
              this._scriptPath = argv[1];
              userArgs = argv.slice(2);
            } else {
              userArgs = argv.slice(1);
            }
            break;
          case "user":
            userArgs = argv.slice(0);
            break;
          default:
            throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
        }
        if (!this._scriptPath && __require.main) {
          this._scriptPath = __require.main.filename;
        }
        this._name = this._name || this._scriptPath && path5.basename(this._scriptPath, path5.extname(this._scriptPath));
        this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Use parseAsync instead of parse if any of your action handlers are async. Returns a Promise.
       *
       * The default expectation is that the arguments are from node and have the application as argv[0]
       * and the script being run in argv[1], with user parameters after that.
       *
       * Examples:
       *
       *      program.parseAsync(process.argv);
       *      program.parseAsync(); // implicitly use process.argv and auto-detect node vs electron conventions
       *      program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv]
       * @param {Object} [parseOptions]
       * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
       * @return {Promise}
       */
      parseAsync(argv, parseOptions) {
        this.parse(argv, parseOptions);
        return Promise.all(this._actionResults).then(() => this);
      }
      /**
       * Execute a sub-command executable.
       *
       * @api private
       */
      _executeSubCommand(subcommand, args) {
        args = args.slice();
        let launchWithNode = false;
        const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
        this._checkForMissingMandatoryOptions();
        let scriptPath = this._scriptPath;
        if (!scriptPath && __require.main) {
          scriptPath = __require.main.filename;
        }
        let baseDir;
        try {
          const resolvedLink = fs.realpathSync(scriptPath);
          baseDir = path5.dirname(resolvedLink);
        } catch (e) {
          baseDir = ".";
        }
        let bin = path5.basename(scriptPath, path5.extname(scriptPath)) + "-" + subcommand._name;
        if (subcommand._executableFile) {
          bin = subcommand._executableFile;
        }
        const localBin = path5.join(baseDir, bin);
        if (fs.existsSync(localBin)) {
          bin = localBin;
        } else {
          sourceExt.forEach((ext) => {
            if (fs.existsSync(`${localBin}${ext}`)) {
              bin = `${localBin}${ext}`;
            }
          });
        }
        launchWithNode = sourceExt.includes(path5.extname(bin));
        let proc;
        if (process.platform !== "win32") {
          if (launchWithNode) {
            args.unshift(bin);
            args = incrementNodeInspectorPort(process.execArgv).concat(args);
            proc = childProcess.spawn(process.argv[0], args, { stdio: "inherit" });
          } else {
            proc = childProcess.spawn(bin, args, { stdio: "inherit" });
          }
        } else {
          args.unshift(bin);
          args = incrementNodeInspectorPort(process.execArgv).concat(args);
          proc = childProcess.spawn(process.execPath, args, { stdio: "inherit" });
        }
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
        const exitCallback = this._exitCallback;
        if (!exitCallback) {
          proc.on("close", process.exit.bind(process));
        } else {
          proc.on("close", () => {
            exitCallback(new CommanderError(process.exitCode || 0, "commander.executeSubCommandAsync", "(close)"));
          });
        }
        proc.on("error", (err) => {
          if (err.code === "ENOENT") {
            const executableMissing = `'${bin}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name`;
            throw new Error(executableMissing);
          } else if (err.code === "EACCES") {
            throw new Error(`'${bin}' not executable`);
          }
          if (!exitCallback) {
            process.exit(1);
          } else {
            const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
            wrappedError.nestedError = err;
            exitCallback(wrappedError);
          }
        });
        this.runningCommand = proc;
      }
      /**
       * @api private
       */
      _dispatchSubcommand(commandName, operands, unknown) {
        const subCommand = this._findCommand(commandName);
        if (!subCommand) this.help({ error: true });
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          subCommand._parseCommand(operands, unknown);
        }
      }
      /**
       * Process arguments in context of this command.
       *
       * @api private
       */
      _parseCommand(operands, unknown) {
        const parsed = this.parseOptions(unknown);
        operands = operands.concat(parsed.operands);
        unknown = parsed.unknown;
        this.args = operands.concat(unknown);
        if (operands && this._findCommand(operands[0])) {
          this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
        } else if (this._hasImplicitHelpCommand() && operands[0] === this._helpCommandName) {
          if (operands.length === 1) {
            this.help();
          } else {
            this._dispatchSubcommand(operands[1], [], [this._helpLongFlag]);
          }
        } else if (this._defaultCommandName) {
          outputHelpIfRequested(this, unknown);
          this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
        } else {
          if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
            this.help({ error: true });
          }
          outputHelpIfRequested(this, parsed.unknown);
          this._checkForMissingMandatoryOptions();
          const checkForUnknownOptions = () => {
            if (parsed.unknown.length > 0) {
              this.unknownOption(parsed.unknown[0]);
            }
          };
          const commandEvent = `command:${this.name()}`;
          if (this._actionHandler) {
            checkForUnknownOptions();
            const args = this.args.slice();
            this._args.forEach((arg, i) => {
              if (arg.required && args[i] == null) {
                this.missingArgument(arg.name);
              } else if (arg.variadic) {
                args[i] = args.splice(i);
                args.length = Math.min(i + 1, args.length);
              }
            });
            if (args.length > this._args.length) {
              this._excessArguments(args);
            }
            this._actionHandler(args);
            if (this.parent) this.parent.emit(commandEvent, operands, unknown);
          } else if (this.parent && this.parent.listenerCount(commandEvent)) {
            checkForUnknownOptions();
            this.parent.emit(commandEvent, operands, unknown);
          } else if (operands.length) {
            if (this._findCommand("*")) {
              this._dispatchSubcommand("*", operands, unknown);
            } else if (this.listenerCount("command:*")) {
              this.emit("command:*", operands, unknown);
            } else if (this.commands.length) {
              this.unknownCommand();
            } else {
              checkForUnknownOptions();
            }
          } else if (this.commands.length) {
            this.help({ error: true });
          } else {
            checkForUnknownOptions();
          }
        }
      }
      /**
       * Find matching command.
       *
       * @api private
       */
      _findCommand(name) {
        if (!name) return void 0;
        return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
      }
      /**
       * Return an option matching `arg` if any.
       *
       * @param {string} arg
       * @return {Option}
       * @api private
       */
      _findOption(arg) {
        return this.options.find((option2) => option2.is(arg));
      }
      /**
       * Display an error message if a mandatory option does not have a value.
       * Lazy calling after checking for help flags from leaf subcommand.
       *
       * @api private
       */
      _checkForMissingMandatoryOptions() {
        for (let cmd = this; cmd; cmd = cmd.parent) {
          cmd.options.forEach((anOption) => {
            if (anOption.mandatory && cmd._getOptionValue(anOption.attributeName()) === void 0) {
              cmd.missingMandatoryOptionValue(anOption);
            }
          });
        }
      }
      /**
       * Parse options from `argv` removing known options,
       * and return argv split into operands and unknown arguments.
       *
       * Examples:
       *
       *    argv => operands, unknown
       *    --known kkk op => [op], []
       *    op --known kkk => [op], []
       *    sub --unknown uuu op => [sub], [--unknown uuu op]
       *    sub -- --unknown uuu op => [sub --unknown uuu op], []
       *
       * @param {String[]} argv
       * @return {{operands: String[], unknown: String[]}}
       */
      parseOptions(argv) {
        const operands = [];
        const unknown = [];
        let dest = operands;
        const args = argv.slice();
        function maybeOption(arg) {
          return arg.length > 1 && arg[0] === "-";
        }
        let activeVariadicOption = null;
        while (args.length) {
          const arg = args.shift();
          if (arg === "--") {
            if (dest === unknown) dest.push(arg);
            dest.push(...args);
            break;
          }
          if (activeVariadicOption && !maybeOption(arg)) {
            this.emit(`option:${activeVariadicOption.name()}`, arg);
            continue;
          }
          activeVariadicOption = null;
          if (maybeOption(arg)) {
            const option2 = this._findOption(arg);
            if (option2) {
              if (option2.required) {
                const value = args.shift();
                if (value === void 0) this.optionMissingArgument(option2);
                this.emit(`option:${option2.name()}`, value);
              } else if (option2.optional) {
                let value = null;
                if (args.length > 0 && !maybeOption(args[0])) {
                  value = args.shift();
                }
                this.emit(`option:${option2.name()}`, value);
              } else {
                this.emit(`option:${option2.name()}`);
              }
              activeVariadicOption = option2.variadic ? option2 : null;
              continue;
            }
          }
          if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
            const option2 = this._findOption(`-${arg[1]}`);
            if (option2) {
              if (option2.required || option2.optional && this._combineFlagAndOptionalValue) {
                this.emit(`option:${option2.name()}`, arg.slice(2));
              } else {
                this.emit(`option:${option2.name()}`);
                args.unshift(`-${arg.slice(2)}`);
              }
              continue;
            }
          }
          if (/^--[^=]+=/.test(arg)) {
            const index = arg.indexOf("=");
            const option2 = this._findOption(arg.slice(0, index));
            if (option2 && (option2.required || option2.optional)) {
              this.emit(`option:${option2.name()}`, arg.slice(index + 1));
              continue;
            }
          }
          if (maybeOption(arg)) {
            dest = unknown;
          }
          if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
            if (this._findCommand(arg)) {
              operands.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            } else if (arg === this._helpCommandName && this._hasImplicitHelpCommand()) {
              operands.push(arg);
              if (args.length > 0) operands.push(...args);
              break;
            } else if (this._defaultCommandName) {
              unknown.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            }
          }
          if (this._passThroughOptions) {
            dest.push(arg);
            if (args.length > 0) dest.push(...args);
            break;
          }
          dest.push(arg);
        }
        return { operands, unknown };
      }
      /**
       * Return an object containing options as key-value pairs
       *
       * @return {Object}
       */
      opts() {
        if (this._storeOptionsAsProperties) {
          const result = {};
          const len = this.options.length;
          for (let i = 0; i < len; i++) {
            const key = this.options[i].attributeName();
            result[key] = key === this._versionOptionName ? this._version : this[key];
          }
          return result;
        }
        return this._optionValues;
      }
      /**
       * Internal bottleneck for handling of parsing errors.
       *
       * @api private
       */
      _displayError(exitCode, code, message) {
        this._outputConfiguration.outputError(`${message}
`, this._outputConfiguration.writeErr);
        this._exit(exitCode, code, message);
      }
      /**
       * Argument `name` is missing.
       *
       * @param {string} name
       * @api private
       */
      missingArgument(name) {
        const message = `error: missing required argument '${name}'`;
        this._displayError(1, "commander.missingArgument", message);
      }
      /**
       * `Option` is missing an argument.
       *
       * @param {Option} option
       * @api private
       */
      optionMissingArgument(option2) {
        const message = `error: option '${option2.flags}' argument missing`;
        this._displayError(1, "commander.optionMissingArgument", message);
      }
      /**
       * `Option` does not have a value, and is a mandatory option.
       *
       * @param {Option} option
       * @api private
       */
      missingMandatoryOptionValue(option2) {
        const message = `error: required option '${option2.flags}' not specified`;
        this._displayError(1, "commander.missingMandatoryOptionValue", message);
      }
      /**
       * Unknown option `flag`.
       *
       * @param {string} flag
       * @api private
       */
      unknownOption(flag) {
        if (this._allowUnknownOption) return;
        const message = `error: unknown option '${flag}'`;
        this._displayError(1, "commander.unknownOption", message);
      }
      /**
       * Excess arguments, more than expected.
       *
       * @param {string[]} receivedArgs
       * @api private
       */
      _excessArguments(receivedArgs) {
        if (this._allowExcessArguments) return;
        const expected = this._args.length;
        const s = expected === 1 ? "" : "s";
        const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
        const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
        this._displayError(1, "commander.excessArguments", message);
      }
      /**
       * Unknown command.
       *
       * @api private
       */
      unknownCommand() {
        const partCommands = [this.name()];
        for (let parentCmd = this.parent; parentCmd; parentCmd = parentCmd.parent) {
          partCommands.unshift(parentCmd.name());
        }
        const fullCommand = partCommands.join(" ");
        const message = `error: unknown command '${this.args[0]}'.` + (this._hasHelpOption ? ` See '${fullCommand} ${this._helpLongFlag}'.` : "");
        this._displayError(1, "commander.unknownCommand", message);
      }
      /**
       * Set the program version to `str`.
       *
       * This method auto-registers the "-V, --version" flag
       * which will print the version number when passed.
       *
       * You can optionally supply the  flags and description to override the defaults.
       *
       * @param {string} str
       * @param {string} [flags]
       * @param {string} [description]
       * @return {this | string} `this` command for chaining, or version string if no arguments
       */
      version(str, flags, description2) {
        if (str === void 0) return this._version;
        this._version = str;
        flags = flags || "-V, --version";
        description2 = description2 || "output the version number";
        const versionOption = this.createOption(flags, description2);
        this._versionOptionName = versionOption.attributeName();
        this.options.push(versionOption);
        this.on("option:" + versionOption.name(), () => {
          this._outputConfiguration.writeOut(`${str}
`);
          this._exit(0, "commander.version", str);
        });
        return this;
      }
      /**
       * Set the description to `str`.
       *
       * @param {string} [str]
       * @param {Object} [argsDescription]
       * @return {string|Command}
       */
      description(str, argsDescription) {
        if (str === void 0 && argsDescription === void 0) return this._description;
        this._description = str;
        this._argsDescription = argsDescription;
        return this;
      }
      /**
       * Set an alias for the command.
       *
       * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
       *
       * @param {string} [alias]
       * @return {string|Command}
       */
      alias(alias) {
        if (alias === void 0) return this._aliases[0];
        let command2 = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command2 = this.commands[this.commands.length - 1];
        }
        if (alias === command2._name) throw new Error("Command alias can't be the same as its name");
        command2._aliases.push(alias);
        return this;
      }
      /**
       * Set aliases for the command.
       *
       * Only the first alias is shown in the auto-generated help.
       *
       * @param {string[]} [aliases]
       * @return {string[]|Command}
       */
      aliases(aliases) {
        if (aliases === void 0) return this._aliases;
        aliases.forEach((alias) => this.alias(alias));
        return this;
      }
      /**
       * Set / get the command usage `str`.
       *
       * @param {string} [str]
       * @return {String|Command}
       */
      usage(str) {
        if (str === void 0) {
          if (this._usage) return this._usage;
          const args = this._args.map((arg) => {
            return humanReadableArgName(arg);
          });
          return [].concat(
            this.options.length || this._hasHelpOption ? "[options]" : [],
            this.commands.length ? "[command]" : [],
            this._args.length ? args : []
          ).join(" ");
        }
        this._usage = str;
        return this;
      }
      /**
       * Get or set the name of the command
       *
       * @param {string} [str]
       * @return {string|Command}
       */
      name(str) {
        if (str === void 0) return this._name;
        this._name = str;
        return this;
      }
      /**
       * Return program help documentation.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
       * @return {string}
       */
      helpInformation(contextOptions) {
        const helper = this.createHelp();
        if (helper.helpWidth === void 0) {
          helper.helpWidth = contextOptions && contextOptions.error ? this._outputConfiguration.getErrHelpWidth() : this._outputConfiguration.getOutHelpWidth();
        }
        return helper.formatHelp(this, helper);
      }
      /**
       * @api private
       */
      _getHelpContext(contextOptions) {
        contextOptions = contextOptions || {};
        const context = { error: !!contextOptions.error };
        let write;
        if (context.error) {
          write = (arg) => this._outputConfiguration.writeErr(arg);
        } else {
          write = (arg) => this._outputConfiguration.writeOut(arg);
        }
        context.write = contextOptions.write || write;
        context.command = this;
        return context;
      }
      /**
       * Output help information for this command.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      outputHelp(contextOptions) {
        let deprecatedCallback;
        if (typeof contextOptions === "function") {
          deprecatedCallback = contextOptions;
          contextOptions = void 0;
        }
        const context = this._getHelpContext(contextOptions);
        const groupListeners = [];
        let command2 = this;
        while (command2) {
          groupListeners.push(command2);
          command2 = command2.parent;
        }
        groupListeners.slice().reverse().forEach((command3) => command3.emit("beforeAllHelp", context));
        this.emit("beforeHelp", context);
        let helpInformation = this.helpInformation(context);
        if (deprecatedCallback) {
          helpInformation = deprecatedCallback(helpInformation);
          if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
            throw new Error("outputHelp callback must return a string or a Buffer");
          }
        }
        context.write(helpInformation);
        this.emit(this._helpLongFlag);
        this.emit("afterHelp", context);
        groupListeners.forEach((command3) => command3.emit("afterAllHelp", context));
      }
      /**
       * You can pass in flags and a description to override the help
       * flags and help description for your command. Pass in false to
       * disable the built-in help option.
       *
       * @param {string | boolean} [flags]
       * @param {string} [description]
       * @return {Command} `this` command for chaining
       */
      helpOption(flags, description2) {
        if (typeof flags === "boolean") {
          this._hasHelpOption = flags;
          return this;
        }
        this._helpFlags = flags || this._helpFlags;
        this._helpDescription = description2 || this._helpDescription;
        const helpFlags = _parseOptionFlags(this._helpFlags);
        this._helpShortFlag = helpFlags.shortFlag;
        this._helpLongFlag = helpFlags.longFlag;
        return this;
      }
      /**
       * Output help information and exit.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      help(contextOptions) {
        this.outputHelp(contextOptions);
        let exitCode = process.exitCode || 0;
        if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
          exitCode = 1;
        }
        this._exit(exitCode, "commander.help", "(outputHelp)");
      }
      /**
       * Add additional text to be displayed with the built-in help.
       *
       * Position is 'before' or 'after' to affect just this command,
       * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
       *
       * @param {string} position - before or after built-in help
       * @param {string | Function} text - string to add, or a function returning a string
       * @return {Command} `this` command for chaining
       */
      addHelpText(position, text) {
        const allowedValues = ["beforeAll", "before", "after", "afterAll"];
        if (!allowedValues.includes(position)) {
          throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        const helpEvent = `${position}Help`;
        this.on(helpEvent, (context) => {
          let helpStr;
          if (typeof text === "function") {
            helpStr = text({ error: context.error, command: context.command });
          } else {
            helpStr = text;
          }
          if (helpStr) {
            context.write(`${helpStr}
`);
          }
        });
        return this;
      }
    };
    exports = module.exports = new Command();
    exports.program = exports;
    exports.Command = Command;
    exports.Option = Option;
    exports.CommanderError = CommanderError;
    exports.InvalidOptionArgumentError = InvalidOptionArgumentError;
    exports.Help = Help;
    function camelcase(flag) {
      return flag.split("-").reduce((str, word) => {
        return str + word[0].toUpperCase() + word.slice(1);
      });
    }
    function outputHelpIfRequested(cmd, args) {
      const helpOption = cmd._hasHelpOption && args.find((arg) => arg === cmd._helpLongFlag || arg === cmd._helpShortFlag);
      if (helpOption) {
        cmd.outputHelp();
        cmd._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
    function humanReadableArgName(arg) {
      const nameOutput = arg.name + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    function _parseOptionFlags(flags) {
      let shortFlag;
      let longFlag;
      const flagParts = flags.split(/[ |,]+/);
      if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1])) shortFlag = flagParts.shift();
      longFlag = flagParts.shift();
      if (!shortFlag && /^-[^-]$/.test(longFlag)) {
        shortFlag = longFlag;
        longFlag = void 0;
      }
      return { shortFlag, longFlag };
    }
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        if (!arg.startsWith("--inspect")) {
          return arg;
        }
        let debugOption;
        let debugHost = "127.0.0.1";
        let debugPort = "9229";
        let match;
        if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
          debugOption = match[1];
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
          debugOption = match[1];
          if (/^\d+$/.test(match[3])) {
            debugPort = match[3];
          } else {
            debugHost = match[3];
          }
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
          debugOption = match[1];
          debugHost = match[3];
          debugPort = match[4];
        }
        if (debugOption && debugPort !== "0") {
          return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
        }
        return arg;
      });
    }
  }
});

// ../../node_modules/commander-ts/dist/metadata.js
var require_metadata = __commonJS({
  "../../node_modules/commander-ts/dist/metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SubcommandMetadata = exports.ProgramMetadata = exports.OptionsMetadata = exports.CommandOptionsMetadata = exports.ArgsMetadata = void 0;
    exports.ArgsMetadata = Symbol("ArgsMetadata");
    exports.CommandOptionsMetadata = Symbol("CommandOptionsMetadata");
    exports.OptionsMetadata = Symbol("OptionsMetadata");
    exports.ProgramMetadata = Symbol("ProgramMetadata");
    exports.SubcommandMetadata = Symbol("SubcommandMetadata");
  }
});

// ../../node_modules/commander-ts/dist/decorators/action.decorator.js
var require_action_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/action.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.action = void 0;
    var commander = require_commander();
    function action() {
      return (target, propertyKey, descriptor) => {
        commander.action(target[propertyKey]);
      };
    }
    exports.action = action;
  }
});

// ../../node_modules/commander-ts/dist/decorators/alias.decorator.js
var require_alias_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/alias.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.alias = void 0;
    var program2 = require_commander();
    function alias(text) {
      return (target) => {
        program2.usage(text);
      };
    }
    exports.alias = alias;
  }
});

// ../../node_modules/commander-ts/dist/models/arg.model.js
var require_arg_model = __commonJS({
  "../../node_modules/commander-ts/dist/models/arg.model.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VariadicArg = exports.RequiredArg = exports.OptionalArg = exports.CommandArg = void 0;
    var CommandArg = class {
      constructor(name, index) {
        this.name = name;
        this.index = index;
        if (typeof name === "symbol") {
          throw new TypeError("Symbols are not supported as argument names.");
        }
      }
    };
    exports.CommandArg = CommandArg;
    var OptionalArg = class extends CommandArg {
      toString() {
        return `[${String(this.name)}]`;
      }
    };
    exports.OptionalArg = OptionalArg;
    var RequiredArg = class extends CommandArg {
      toString() {
        return `<${String(this.name)}>`;
      }
    };
    exports.RequiredArg = RequiredArg;
    var VariadicArg = class extends CommandArg {
      toString() {
        return `[${String(this.name)}...]`;
      }
    };
    exports.VariadicArg = VariadicArg;
  }
});

// ../../node_modules/commander-ts/dist/models/option.model.js
var require_option_model = __commonJS({
  "../../node_modules/commander-ts/dist/models/option.model.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Option = void 0;
    var Option = class {
      constructor(name, args) {
        this.name = name;
        this.args = args;
      }
    };
    exports.Option = Option;
  }
});

// ../../node_modules/commander-ts/dist/models/index.js
var require_models = __commonJS({
  "../../node_modules/commander-ts/dist/models/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_arg_model(), exports);
    __exportStar(require_option_model(), exports);
  }
});

// ../../node_modules/commander-ts/dist/utils/decorateIfNot.js
var require_decorateIfNot = __commonJS({
  "../../node_modules/commander-ts/dist/utils/decorateIfNot.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decorateIfNot = void 0;
    function decorateIfNot(metadataKey, value, target, propertyKey) {
      if (!Reflect.hasMetadata(metadataKey, target, propertyKey)) {
        const decorator = Reflect.metadata(metadataKey, value);
        Reflect.decorate([decorator], target, propertyKey);
      }
      return Reflect.getMetadata(metadataKey, target, propertyKey);
    }
    exports.decorateIfNot = decorateIfNot;
  }
});

// ../../node_modules/commander-ts/dist/utils/index.js
var require_utils = __commonJS({
  "../../node_modules/commander-ts/dist/utils/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_decorateIfNot(), exports);
  }
});

// ../../node_modules/commander-ts/dist/decorators/arg.decorator.js
var require_arg_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/arg.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.variadicArg = exports.requiredArg = exports.optionalArg = void 0;
    var metadata_1 = require_metadata();
    var models_1 = require_models();
    var utils_1 = require_utils();
    function optionalArg2(name) {
      return (target, propertyKey, parameterIndex) => {
        const args = (0, utils_1.decorateIfNot)(metadata_1.ArgsMetadata, [], target, propertyKey);
        args.unshift(new models_1.OptionalArg(name, parameterIndex));
      };
    }
    exports.optionalArg = optionalArg2;
    function requiredArg2(name) {
      return (target, propertyKey, parameterIndex) => {
        const args = (0, utils_1.decorateIfNot)(metadata_1.ArgsMetadata, [], target, propertyKey);
        args.unshift(new models_1.RequiredArg(name, parameterIndex));
      };
    }
    exports.requiredArg = requiredArg2;
    function variadicArg(name) {
      return (target, propertyKey, parameterIndex) => {
        const args = (0, utils_1.decorateIfNot)(metadata_1.ArgsMetadata, [], target, propertyKey);
        args.unshift(new models_1.VariadicArg(name, parameterIndex));
      };
    }
    exports.variadicArg = variadicArg;
  }
});

// ../../node_modules/commander-ts/dist/decorators/arguments.decorator.js
var require_arguments_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/arguments.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.args = void 0;
    var commander = require_commander();
    function args() {
      return (target, propertyKey, parameterIndex) => {
        commander.option(propertyKey).action(target[propertyKey]);
      };
    }
    exports.args = args;
  }
});

// ../../node_modules/commander-ts/dist/decorators/command-option.decorator.js
var require_command_option_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/command-option.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.commandOption = void 0;
    var metadata_1 = require_metadata();
    var utils_1 = require_utils();
    function commandOption2(...args) {
      return ((target, propertyKey, descriptor) => {
        args[0] = args[0] || `--${String(propertyKey)}`;
        (0, utils_1.decorateIfNot)(metadata_1.CommandOptionsMetadata, [], target, propertyKey);
        const options = Reflect.getMetadata(metadata_1.CommandOptionsMetadata, target, propertyKey);
        options.push(args);
      });
    }
    exports.commandOption = commandOption2;
  }
});

// ../../node_modules/commander-ts/dist/helpers/init-commander.js
var require_init_commander = __commonJS({
  "../../node_modules/commander-ts/dist/helpers/init-commander.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initCommander = void 0;
    var commander = require_commander();
    var metadata_1 = require_metadata();
    function initCommander(target) {
      if (!Reflect.hasMetadata(metadata_1.ProgramMetadata, target)) {
        const decorator = Reflect.metadata(metadata_1.ProgramMetadata, commander);
        Reflect.decorate([decorator], target);
      }
    }
    exports.initCommander = initCommander;
  }
});

// ../../node_modules/commander-ts/dist/helpers/inject-args.js
var require_inject_args = __commonJS({
  "../../node_modules/commander-ts/dist/helpers/inject-args.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.injectArgs = void 0;
    var metadata_1 = require_metadata();
    var index_1 = require_models();
    function injectArgs(program2, target, propertyKey) {
      if (Reflect.hasMetadata(metadata_1.ArgsMetadata, target, propertyKey)) {
        const args = Reflect.getMetadata(metadata_1.ArgsMetadata, target, propertyKey);
        const predicate = (arg) => arg instanceof index_1.VariadicArg;
        const variadic = args.find(predicate);
        if (variadic && args.findIndex(predicate) !== args.length - 1) {
          throw new TypeError(`Variadic argument must be specified last the argument list of the ${String(propertyKey)}() function.`);
        }
        const argv = [];
        let index = 0;
        for (let i = 0; i < args.length; i += 1) {
          if (args.find((arg) => arg.index === i)) {
            argv.push(program2.args[index]);
            index += 1;
          } else {
            argv.push(void 0);
          }
        }
        return argv;
      }
    }
    exports.injectArgs = injectArgs;
  }
});

// ../../node_modules/commander-ts/dist/helpers/prepare-command.js
var require_prepare_command = __commonJS({
  "../../node_modules/commander-ts/dist/helpers/prepare-command.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prepareSubcommand = exports.prepareCommand = void 0;
    var metadata_1 = require_metadata();
    var index_1 = require_models();
    function prepareCommand(target, propertyKey) {
      let argList = "";
      if (Reflect.hasMetadata(metadata_1.ArgsMetadata, target, propertyKey)) {
        const args = Reflect.getMetadata(metadata_1.ArgsMetadata, target, propertyKey);
        const predicate = (arg) => arg instanceof index_1.VariadicArg;
        const variadic = args.find(predicate);
        if (variadic && args.findIndex(predicate) !== args.length - 1) {
          throw new TypeError(`Variadic argument must be specified last the argument list of the ${String(propertyKey)}() function.`);
        }
        argList = args.map((arg) => {
          return arg.toString();
        }).join(" ").replace(/^(.)/, "$1");
      }
      return `${argList}`;
    }
    exports.prepareCommand = prepareCommand;
    function prepareSubcommand(target, propertyKey) {
      const argList = prepareCommand(target, propertyKey);
      return `${String(propertyKey)} ${argList}`;
    }
    exports.prepareSubcommand = prepareSubcommand;
  }
});

// ../../node_modules/commander-ts/dist/helpers/index.js
var require_helpers = __commonJS({
  "../../node_modules/commander-ts/dist/helpers/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_init_commander(), exports);
    __exportStar(require_inject_args(), exports);
    __exportStar(require_prepare_command(), exports);
  }
});

// ../../node_modules/commander-ts/dist/decorators/command.decorator.js
var require_command_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/command.decorator.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.command = void 0;
    var commander = require_commander();
    var helpers_1 = require_helpers();
    var metadata_1 = require_metadata();
    function command2() {
      return (target, propertyKey, descriptor) => {
        try {
          const cmd = (0, helpers_1.prepareSubcommand)(target, propertyKey);
          let chain = commander.command(cmd);
          if (Reflect.hasMetadata(metadata_1.CommandOptionsMetadata, target, propertyKey)) {
            const options = Reflect.getMetadata(metadata_1.CommandOptionsMetadata, target, propertyKey);
            chain = options.reduce((prev, opt) => {
              const [arg1, arg2, arg3, arg4] = opt;
              return chain.option(arg1, arg2, arg3, arg4);
            }, chain);
          }
          chain.action((...args) => __awaiter(this, void 0, void 0, function* () {
            const context = args[args.length - 1];
            const cmdArgs = args.slice(0, args.length - 1);
            try {
              const result = target[propertyKey].apply(context, cmdArgs);
              if (result instanceof Promise) {
                yield result;
              }
            } catch (_a) {
              process.exit(1);
            } finally {
              process.exit(0);
            }
          }));
        } catch (e) {
          console.error(e.message);
          process.exit(1);
        }
      };
    }
    exports.command = command2;
  }
});

// ../../node_modules/commander-ts/dist/decorators/description.decorator.js
var require_description_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/description.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.description = void 0;
    var program2 = require_commander();
    function description2(text) {
      return (target) => {
        program2.description(text);
      };
    }
    exports.description = description2;
  }
});

// ../../node_modules/commander-ts/dist/decorators/on.decorator.js
var require_on_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/on.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.on = void 0;
    var commander = require_commander();
    function on(event, handler) {
      return (target, propertyKey, descriptor) => {
        commander.on(event, handler);
      };
    }
    exports.on = on;
  }
});

// ../../node_modules/commander-ts/dist/decorators/option.decorator.js
var require_option_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/option.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.option = void 0;
    var metadata_1 = require_metadata();
    var models_1 = require_models();
    var utils_1 = require_utils();
    function option2(...args) {
      return ((target, propertyKey) => {
        args[0] = args[0] || `--${String(propertyKey)}`;
        (0, utils_1.decorateIfNot)(metadata_1.OptionsMetadata, [], target, propertyKey);
        const options = Reflect.getMetadata(metadata_1.OptionsMetadata, target, propertyKey);
        options.push(new models_1.Option(propertyKey, args));
      });
    }
    exports.option = option2;
  }
});

// ../../node_modules/commander-ts/dist/decorators/program.decorator.js
var require_program_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/program.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.program = void 0;
    var commander = require_commander();
    var helpers_1 = require_helpers();
    var metadata_1 = require_metadata();
    var instances = 0;
    function program2() {
      instances += 1;
      if (instances > 1) {
        throw new Error("Only one instance of @program is permitted.");
      }
      return function(constructor) {
        const mixin = class extends constructor {
          constructor(...args) {
            super(...args);
            if (!this.run) {
              console.error("Program class must define a run() method.");
              process.exit(1);
            }
            const cmd = (0, helpers_1.prepareCommand)(this, "run");
            if (cmd) {
              commander.command(cmd);
            }
            const options = Object.keys(this).reduce((list, prop) => {
              if (Reflect.hasMetadata(metadata_1.OptionsMetadata, this, prop)) {
                const metadata = Reflect.getMetadata(metadata_1.OptionsMetadata, this, prop);
                list.push(metadata);
              }
              return list;
            }, []);
            const chainAfterOptions = options.reduce((prev, option2) => {
              return prev.option.apply(prev, option2[0].args);
            }, commander);
            commander.parse(process.argv);
            if (this.run) {
              this.run.apply(commander, (0, helpers_1.injectArgs)(commander, this, "run"));
            }
          }
        };
        (0, helpers_1.initCommander)(constructor);
        return mixin;
      };
    }
    exports.program = program2;
  }
});

// ../../node_modules/commander-ts/dist/decorators/usage.decorator.js
var require_usage_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/usage.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.usage = void 0;
    var commander = require_commander();
    function usage2(text) {
      return (target) => {
        commander.usage(text);
      };
    }
    exports.usage = usage2;
  }
});

// ../../node_modules/commander-ts/dist/decorators/version.decorator.js
var require_version_decorator = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/version.decorator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = void 0;
    var helpers_1 = require_helpers();
    var metadata_1 = require_metadata();
    function version2(text) {
      return (target) => {
        (0, helpers_1.initCommander)(target);
        const program2 = Reflect.getMetadata(metadata_1.ProgramMetadata, target);
        program2.version(text);
      };
    }
    exports.version = version2;
  }
});

// ../../node_modules/commander-ts/dist/decorators/index.js
var require_decorators = __commonJS({
  "../../node_modules/commander-ts/dist/decorators/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_metadata(), exports);
    __exportStar(require_action_decorator(), exports);
    __exportStar(require_alias_decorator(), exports);
    __exportStar(require_arg_decorator(), exports);
    __exportStar(require_arguments_decorator(), exports);
    __exportStar(require_command_option_decorator(), exports);
    __exportStar(require_command_decorator(), exports);
    __exportStar(require_description_decorator(), exports);
    __exportStar(require_on_decorator(), exports);
    __exportStar(require_option_decorator(), exports);
    __exportStar(require_program_decorator(), exports);
    __exportStar(require_usage_decorator(), exports);
    __exportStar(require_version_decorator(), exports);
  }
});

// ../../node_modules/commander-ts/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/commander-ts/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Option = exports.Command = void 0;
    require_Reflect();
    var commander_1 = require_commander();
    Object.defineProperty(exports, "Command", { enumerable: true, get: function() {
      return commander_1.Command;
    } });
    Object.defineProperty(exports, "Option", { enumerable: true, get: function() {
      return commander_1.Option;
    } });
    __exportStar(require_decorators(), exports);
  }
});

// src/updater.ts
import crypto2 from "node:crypto";
import { chmod as chmod2, copyFile, mkdir as mkdir3, mkdtemp, rm as rm3, writeFile as writeFile3 } from "node:fs/promises";
import os from "node:os";
import path3 from "node:path";
import { spawn } from "node:child_process";

// src/constants.ts
var DEFAULT_APP_URL = "https://project-qah0p.vercel.app";
var DEFAULT_UPDATE_MANIFEST_URL = `${DEFAULT_APP_URL}/api/cli/latest`;
var DEFAULT_STALE_AFTER_HOURS = 24;
var DEFAULT_CALLBACK_PORT = 8787;
var API_BEARER_SCOPE = "instagram-insights:api";

// src/build-constants.ts
var EMBEDDED_CLI_VERSION = true ? "1.0.0" : process.env.INSTAGRAM_INSIGHTS_EMBEDDED_VERSION ?? "1.0.0";
var EMBEDDED_UPDATE_MANIFEST_URL = true ? "https://project-qah0p.vercel.app/api/cli/latest" : process.env.INSTAGRAM_INSIGHTS_EMBEDDED_UPDATE_MANIFEST_URL ?? DEFAULT_UPDATE_MANIFEST_URL2;

// src/auth-store.ts
import { existsSync } from "node:fs";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
function hasSkillMarker(candidate) {
  return existsSync(path.join(candidate, "SKILL.md"));
}
function resolveFromExecutable() {
  const execCandidate = path.resolve(path.dirname(process.execPath), "..");
  return hasSkillMarker(execCandidate) ? execCandidate : null;
}
function resolveFromWorkingTree() {
  let current = path.resolve(process.cwd());
  while (true) {
    for (const candidate of [current, path.join(current, "skills", "instagram-insights")]) {
      if (hasSkillMarker(candidate)) {
        return candidate;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}
function resolveSkillRoot() {
  const explicit = process.env.INSTAGRAM_INSIGHTS_SKILL_ROOT?.trim();
  if (explicit) {
    return explicit;
  }
  return resolveFromExecutable() ?? resolveFromWorkingTree() ?? path.resolve(process.cwd(), "skills", "instagram-insights");
}
function resolveAuthDir() {
  return path.join(resolveSkillRoot(), ".auth");
}
function resolveAuthStatePath() {
  return path.join(resolveAuthDir(), "state.json");
}
function createEmptyState(appUrl = DEFAULT_APP_URL) {
  return {
    appUrl,
    clientId: null,
    redirectUri: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null
  };
}
async function readAuthState() {
  try {
    const raw = await readFile(resolveAuthStatePath(), "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...createEmptyState(parsed.appUrl ?? DEFAULT_APP_URL),
      ...parsed
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return createEmptyState();
    }
    throw error;
  }
}
async function writeAuthState(state) {
  const authDir = resolveAuthDir();
  const target = resolveAuthStatePath();
  await mkdir(authDir, { recursive: true, mode: 448 });
  await chmod(authDir, 448).catch(() => void 0);
  await writeFile(target, JSON.stringify(state, null, 2), "utf8");
  await chmod(target, 384).catch(() => void 0);
}
async function clearAuthTokens() {
  await rm(resolveAuthDir(), { recursive: true, force: true });
}

// src/version.ts
import { existsSync as existsSync2, readFileSync } from "node:fs";
import { mkdir as mkdir2, readFile as readFile2, rm as rm2, writeFile as writeFile2 } from "node:fs/promises";
import path2 from "node:path";
var AUTO_UPDATE_TTL_MS = 12 * 60 * 60 * 1e3;
var DISABLE_AUTO_UPDATE_ENV = "INSTAGRAM_INSIGHTS_DISABLE_AUTO_UPDATE";
var SKIP_UPDATE_CHECK_ENV = "INSTAGRAM_INSIGHTS_SKIP_UPDATE_CHECK";
var UPDATE_MANIFEST_URL_ENV = "INSTAGRAM_INSIGHTS_UPDATE_MANIFEST_URL";
var MANAGED_SKILL_FILES = [
  "bin/instagram-insights.mjs",
  "bin/instagram-insights-updater.mjs",
  "bin/instagram-insights.version.json"
];
function resolveInstalledVersionPath(skillRoot = resolveSkillRoot()) {
  return path2.join(skillRoot, "bin", "instagram-insights.version.json");
}
function resolveUpdateCachePath(skillRoot = resolveSkillRoot()) {
  return path2.join(skillRoot, ".cache", "update-check.json");
}
function resolveSkillEntrypointPath(skillRoot = resolveSkillRoot()) {
  return path2.join(skillRoot, "bin", "instagram-insights.mjs");
}
function resolveUpdaterEntrypointPath(skillRoot = resolveSkillRoot()) {
  return path2.join(skillRoot, "bin", "instagram-insights-updater.mjs");
}
function isManagedSkillInstall(skillRoot = resolveSkillRoot()) {
  return existsSync2(path2.join(skillRoot, "SKILL.md"));
}
function parseInstalledVersionMetadata(input) {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed.version !== "string" || parsed.version.trim().length === 0) {
      return null;
    }
    return {
      version: parsed.version.trim(),
      installedAt: typeof parsed.installedAt === "string" ? parsed.installedAt : null
    };
  } catch {
    return null;
  }
}
function parseUpdateCheckCache(input) {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed.checkedAt !== "string" || typeof parsed.remoteVersion !== "string" || typeof parsed.updateAvailable !== "boolean" || typeof parsed.manifestUrl !== "string") {
      return null;
    }
    return {
      checkedAt: parsed.checkedAt,
      localVersion: typeof parsed.localVersion === "string" ? parsed.localVersion : null,
      remoteVersion: parsed.remoteVersion,
      updateAvailable: parsed.updateAvailable,
      manifestUrl: parsed.manifestUrl
    };
  } catch {
    return null;
  }
}
function readInstalledVersionMetadataSync(skillRoot = resolveSkillRoot()) {
  try {
    const raw = readFileSync(resolveInstalledVersionPath(skillRoot), "utf8");
    return parseInstalledVersionMetadata(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
async function readInstalledVersionMetadata(skillRoot = resolveSkillRoot()) {
  try {
    const raw = await readFile2(resolveInstalledVersionPath(skillRoot), "utf8");
    return parseInstalledVersionMetadata(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
async function readUpdateCheckCache(skillRoot = resolveSkillRoot()) {
  try {
    const raw = await readFile2(resolveUpdateCachePath(skillRoot), "utf8");
    return parseUpdateCheckCache(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
async function writeUpdateCheckCache(cache, skillRoot = resolveSkillRoot()) {
  const target = resolveUpdateCachePath(skillRoot);
  await mkdir2(path2.dirname(target), { recursive: true });
  await writeFile2(target, `${JSON.stringify(cache, null, 2)}
`, "utf8");
}
async function clearUpdateCheckCache(skillRoot = resolveSkillRoot()) {
  await rm2(resolveUpdateCachePath(skillRoot), { force: true });
}
function getConfiguredManifestUrl() {
  const override = process.env[UPDATE_MANIFEST_URL_ENV]?.trim();
  if (override) {
    return override;
  }
  const embedded = EMBEDDED_UPDATE_MANIFEST_URL.trim();
  return embedded.length > 0 ? embedded : null;
}
function isAutoUpdateDisabled() {
  return process.env[DISABLE_AUTO_UPDATE_ENV] === "1";
}
function shouldSkipUpdateCheck() {
  return process.env[SKIP_UPDATE_CHECK_ENV] === "1";
}
function getCliVersion() {
  return readInstalledVersionMetadataSync()?.version ?? EMBEDDED_CLI_VERSION;
}

// src/updater.ts
function logUpdate(message) {
  console.error(`[instagram-insights:update] ${message}`);
}
function parseSemver(version2) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version2.trim());
  if (!match) {
    return null;
  }
  return match.slice(1).map((part) => Number.parseInt(part, 10));
}
function compareVersions(left, right) {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);
  if (!leftParts || !rightParts) {
    return null;
  }
  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] > rightParts[index]) {
      return 1;
    }
    if (leftParts[index] < rightParts[index]) {
      return -1;
    }
  }
  return 0;
}
function getDefaultCheckResult(status, input) {
  const currentVersion = getCliVersion();
  return {
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status,
    manifestUrl: input.manifestUrl ?? null,
    embeddedVersion: EMBEDDED_CLI_VERSION,
    currentVersion,
    localVersion: input.localVersion ?? null,
    remoteVersion: input.remoteVersion ?? null,
    legacyInstall: input.legacyInstall ?? false,
    updateAvailable: input.updateAvailable ?? false,
    notes: input.notes ?? "",
    fromCache: input.fromCache ?? false,
    manifest: input.manifest ?? null,
    error: input.error ?? null
  };
}
function validateRemoteFile(input) {
  if (!input || typeof input !== "object") {
    return null;
  }
  const candidate = input;
  if (typeof candidate.path !== "string" || candidate.path.trim().length === 0 || typeof candidate.url !== "string" || candidate.url.trim().length === 0 || typeof candidate.sha256 !== "string" || !/^[a-fA-F0-9]{64}$/.test(candidate.sha256.trim())) {
    return null;
  }
  return {
    path: candidate.path.trim(),
    url: candidate.url.trim(),
    sha256: candidate.sha256.trim().toLowerCase()
  };
}
function validateRemoteManifest(input) {
  if (!input || typeof input !== "object") {
    return null;
  }
  const candidate = input;
  if (typeof candidate.version !== "string" || parseSemver(candidate.version) === null || typeof candidate.publishedAt !== "string" || typeof candidate.notes !== "string" || !Array.isArray(candidate.files)) {
    return null;
  }
  const files = candidate.files.map((file) => validateRemoteFile(file)).filter((file) => file !== null);
  if (files.length !== candidate.files.length || files.length === 0) {
    return null;
  }
  return {
    version: candidate.version,
    publishedAt: candidate.publishedAt,
    notes: candidate.notes,
    files
  };
}
function hasCompatibleManagedFiles(files) {
  if (files.length !== MANAGED_SKILL_FILES.length) {
    return false;
  }
  const expected = new Set(MANAGED_SKILL_FILES);
  const seen = /* @__PURE__ */ new Set();
  for (const file of files) {
    if (!expected.has(file.path) || seen.has(file.path)) {
      return false;
    }
    seen.add(file.path);
  }
  return seen.size === expected.size;
}
async function fetchRemoteManifest(manifestUrl) {
  logUpdate(`Fetching update manifest from ${manifestUrl}`);
  const response = await fetch(manifestUrl, {
    headers: {
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(5e3)
  });
  if (!response.ok) {
    throw new Error(`Manifest request failed with status ${response.status}.`);
  }
  return validateRemoteManifest(await response.json());
}
function isCacheFresh(checkedAt) {
  const parsed = Date.parse(checkedAt);
  if (Number.isNaN(parsed)) {
    return false;
  }
  return Date.now() - parsed < AUTO_UPDATE_TTL_MS;
}
function isSameOrNewerVersion(remoteVersion, localVersion) {
  if (!localVersion) {
    return true;
  }
  const comparison = compareVersions(remoteVersion, localVersion);
  return comparison !== null && comparison >= 0;
}
function canAutoUpdate(args) {
  if (args[0] === "update") {
    return false;
  }
  if (isAutoUpdateDisabled() || shouldSkipUpdateCheck()) {
    return false;
  }
  if (!isManagedSkillInstall()) {
    return false;
  }
  return Boolean(getConfiguredManifestUrl());
}
async function checkForUpdates(options) {
  const manifestUrl = getConfiguredManifestUrl();
  const localMetadata = await readInstalledVersionMetadata();
  const localVersion = localMetadata?.version ?? null;
  const legacyInstall = localMetadata === null;
  if (!manifestUrl) {
    return getDefaultCheckResult("disabled", {
      manifestUrl: null,
      localVersion,
      legacyInstall,
      notes: "Update manifest URL is not configured for this build."
    });
  }
  if (options.allowCache && !options.force) {
    const cache = await readUpdateCheckCache();
    if (cache && cache.manifestUrl === manifestUrl && cache.localVersion === localVersion && isCacheFresh(cache.checkedAt)) {
      return getDefaultCheckResult(cache.updateAvailable ? "cache" : "cache", {
        manifestUrl,
        localVersion,
        legacyInstall,
        remoteVersion: cache.remoteVersion,
        updateAvailable: cache.updateAvailable,
        fromCache: true,
        notes: cache.updateAvailable ? `Update ${cache.remoteVersion} is still available.` : "Current version is up to date."
      });
    }
  }
  try {
    const manifest = await fetchRemoteManifest(manifestUrl);
    if (!manifest) {
      return getDefaultCheckResult("invalid-manifest", {
        manifestUrl,
        localVersion,
        legacyInstall,
        error: "Remote manifest is missing required fields."
      });
    }
    if (!hasCompatibleManagedFiles(manifest.files)) {
      return getDefaultCheckResult("invalid-manifest", {
        manifestUrl,
        localVersion,
        legacyInstall,
        remoteVersion: manifest.version,
        notes: manifest.notes,
        manifest,
        error: "Remote manifest targets a legacy artifact layout and cannot be applied to the bundled Node runtime."
      });
    }
    const comparison = localVersion === null ? 1 : compareVersions(manifest.version, localVersion);
    const updateAvailable = options.force || localVersion === null ? isSameOrNewerVersion(manifest.version, localVersion) : comparison !== null && comparison > 0;
    const status = updateAvailable ? "update-available" : "current";
    await writeUpdateCheckCache({
      checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
      localVersion,
      remoteVersion: manifest.version,
      updateAvailable,
      manifestUrl
    });
    return getDefaultCheckResult(status, {
      manifestUrl,
      localVersion,
      remoteVersion: manifest.version,
      legacyInstall,
      updateAvailable,
      notes: manifest.notes,
      manifest
    });
  } catch (error) {
    return getDefaultCheckResult("network-error", {
      manifestUrl,
      localVersion,
      legacyInstall,
      error: error instanceof Error ? error.message : "Unable to fetch updates."
    });
  }
}
function resolveManagedPath(baseDir, relativePath) {
  const target = path3.resolve(baseDir, relativePath);
  const normalizedBase = `${path3.resolve(baseDir)}${path3.sep}`;
  if (target !== path3.resolve(baseDir) && !target.startsWith(normalizedBase)) {
    throw new Error(`Refusing to access path outside the managed skill root: ${relativePath}`);
  }
  return target;
}
async function downloadManagedFile(stagingDir, file) {
  logUpdate(`Downloading ${file.path} from ${file.url}`);
  const response = await fetch(file.url, {
    signal: AbortSignal.timeout(15e3)
  });
  if (!response.ok) {
    throw new Error(`Download failed for ${file.path}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const digest = crypto2.createHash("sha256").update(buffer).digest("hex");
  if (digest !== file.sha256) {
    throw new Error(`Checksum mismatch for ${file.path}.`);
  }
  logUpdate(`Verified ${file.path}`);
  const target = resolveManagedPath(stagingDir, file.path);
  await mkdir3(path3.dirname(target), { recursive: true });
  await writeFile3(target, buffer);
}
async function runUpdaterHelper(payloadPath) {
  const skillRoot = resolveSkillRoot();
  const bundledHelperPath = resolveUpdaterEntrypointPath();
  const helperCopyPath = path3.join(
    path3.dirname(payloadPath),
    "instagram-insights-updater.run.mjs"
  );
  await copyFile(bundledHelperPath, helperCopyPath);
  await chmod2(helperCopyPath, 493).catch(() => void 0);
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [helperCopyPath, "--payload", payloadPath], {
      stdio: "inherit",
      env: {
        ...process.env,
        INSTAGRAM_INSIGHTS_SKILL_ROOT: skillRoot
      }
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Updater helper exited with code ${code ?? 1}.`));
    });
  });
}
async function applyUpdate(checkResult, options) {
  if (!checkResult.manifestUrl || !checkResult.manifest) {
    return {
      applied: false,
      previousVersion: checkResult.localVersion,
      currentVersion: checkResult.currentVersion,
      manifestUrl: checkResult.manifestUrl,
      remoteVersion: checkResult.remoteVersion,
      legacyInstall: checkResult.legacyInstall,
      notes: checkResult.notes,
      reason: checkResult.error ?? "No remote manifest is available."
    };
  }
  if (!hasCompatibleManagedFiles(checkResult.manifest.files)) {
    return {
      applied: false,
      previousVersion: checkResult.localVersion,
      currentVersion: checkResult.currentVersion,
      manifestUrl: checkResult.manifestUrl,
      remoteVersion: checkResult.remoteVersion,
      legacyInstall: checkResult.legacyInstall,
      notes: checkResult.notes,
      reason: "Remote manifest targets a legacy artifact layout and cannot be applied to the bundled Node runtime."
    };
  }
  const canApplyVersion = checkResult.remoteVersion !== null && isSameOrNewerVersion(checkResult.remoteVersion, checkResult.localVersion);
  const shouldApply = canApplyVersion && (options?.force === true || checkResult.updateAvailable);
  if (!shouldApply) {
    return {
      applied: false,
      previousVersion: checkResult.localVersion,
      currentVersion: checkResult.currentVersion,
      manifestUrl: checkResult.manifestUrl,
      remoteVersion: checkResult.remoteVersion,
      legacyInstall: checkResult.legacyInstall,
      notes: checkResult.notes,
      reason: "Already running the latest available version."
    };
  }
  const stagingDir = await mkdtemp(path3.join(os.tmpdir(), "instagram-insights-update-"));
  const payloadPath = path3.join(stagingDir, "update-payload.json");
  try {
    logUpdate(
      `Applying update ${checkResult.localVersion ?? "unversioned"} -> ${checkResult.manifest.version}`
    );
    await Promise.all(
      checkResult.manifest.files.map((file) => downloadManagedFile(stagingDir, file))
    );
    await writeFile3(
      payloadPath,
      `${JSON.stringify(
        {
          skillRoot: resolveSkillRoot(),
          stagingDir,
          version: checkResult.manifest.version,
          files: checkResult.manifest.files.map((file) => ({ path: file.path }))
        },
        null,
        2
      )}
`,
      "utf8"
    );
    await runUpdaterHelper(payloadPath);
    logUpdate(`Applied update ${checkResult.manifest.version}`);
    await clearUpdateCheckCache();
    await writeUpdateCheckCache({
      checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
      localVersion: checkResult.manifest.version,
      remoteVersion: checkResult.manifest.version,
      updateAvailable: false,
      manifestUrl: checkResult.manifestUrl
    });
    return {
      applied: true,
      previousVersion: checkResult.localVersion,
      currentVersion: checkResult.manifest.version,
      manifestUrl: checkResult.manifestUrl,
      remoteVersion: checkResult.manifest.version,
      legacyInstall: checkResult.legacyInstall,
      notes: checkResult.manifest.notes
    };
  } finally {
    await rm3(stagingDir, { recursive: true, force: true });
  }
}
async function relaunchCli(args) {
  const skillRoot = resolveSkillRoot();
  const entrypoint = resolveSkillEntrypointPath();
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entrypoint, ...args], {
      stdio: "inherit",
      env: {
        ...process.env,
        INSTAGRAM_INSIGHTS_SKILL_ROOT: skillRoot,
        [SKIP_UPDATE_CHECK_ENV]: "1"
      }
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }
      resolve(code ?? 0);
    });
  });
  process.exit(exitCode);
}

// src/cli-main.ts
var import_reflect_metadata = __toESM(require_Reflect(), 1);
var import_commander_ts = __toESM(require_dist(), 1);
import process3 from "node:process";

// src/browser.ts
import { spawn as spawn2 } from "node:child_process";
import process2 from "node:process";
async function openBrowser(url) {
  const platform = process2.platform;
  if (platform === "darwin") {
    spawn2("open", [url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (platform === "win32") {
    spawn2("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore"
    }).unref();
    return;
  }
  spawn2("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

// src/output.ts
function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}
function printText(text) {
  console.log(text);
}
function fail(message, details) {
  const payload = {
    error: message,
    ...details ?? {}
  };
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

// src/oauth.ts
import crypto3 from "node:crypto";
import http from "node:http";
function sha256Base64Url(input) {
  return crypto3.createHash("sha256").update(input).digest("base64url");
}
function randomBase64Url(bytes = 32) {
  return crypto3.randomBytes(bytes).toString("base64url");
}
function normalizeAppUrl(appUrl) {
  return appUrl.replace(/\/+$/, "");
}
function buildLoopbackRedirectUri(port = DEFAULT_CALLBACK_PORT) {
  return `http://127.0.0.1:${port}/callback`;
}
async function registerPublicClient(input) {
  const response = await fetch(`${normalizeAppUrl(input.appUrl)}/oauth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_name: "Instagram Insights CLI",
      redirect_uris: [input.redirectUri],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: API_BEARER_SCOPE
    })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || !("client_id" in payload)) {
    fail("Unable to register CLI OAuth client.", {
      appUrl: input.appUrl,
      status: response.status,
      response: payload
    });
  }
  return payload;
}
async function exchangeAuthorizationCode(input) {
  const formData = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    code: input.code,
    code_verifier: input.codeVerifier
  });
  const response = await fetch(`${normalizeAppUrl(input.appUrl)}/oauth/token`, {
    method: "POST",
    body: formData
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || !("access_token" in payload)) {
    fail("OAuth code exchange failed.", {
      appUrl: input.appUrl,
      status: response.status,
      response: payload
    });
  }
  return payload;
}
async function refreshAccessToken(input) {
  const formData = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: input.clientId,
    refresh_token: input.refreshToken
  });
  const response = await fetch(`${normalizeAppUrl(input.appUrl)}/oauth/token`, {
    method: "POST",
    body: formData
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || !("access_token" in payload)) {
    fail("OAuth refresh failed.", {
      appUrl: input.appUrl,
      status: response.status,
      response: payload
    });
  }
  return payload;
}
async function waitForCallback(input) {
  const redirectUrl = new URL(input.redirectUri);
  const port = Number.parseInt(redirectUrl.port, 10);
  const hostname = redirectUrl.hostname;
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close(() => void 0);
      reject(new Error("Timed out waiting for OAuth callback."));
    }, 10 * 60 * 1e3);
    const server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url ?? "/", input.redirectUri);
      const code = requestUrl.searchParams.get("code");
      const state = requestUrl.searchParams.get("state");
      const error = requestUrl.searchParams.get("error");
      response.statusCode = 200;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(
        [
          "<!doctype html>",
          '<html><body style="font-family: system-ui; padding: 32px;">',
          "<h1>Instagram Insights CLI</h1>",
          error ? `<p>Authentication failed: ${error}</p>` : "<p>Authentication complete. You can return to the terminal.</p>",
          "</body></html>"
        ].join("")
      );
      clearTimeout(timeout);
      server.close(() => void 0);
      if (state !== input.expectedState) {
        reject(new Error("OAuth state mismatch."));
        return;
      }
      if (error) {
        resolve({
          code: null,
          state,
          error
        });
        return;
      }
      if (!code) {
        reject(new Error("OAuth callback did not include an authorization code."));
        return;
      }
      resolve({
        code,
        state,
        error: null
      });
    });
    server.once("error", reject);
    server.listen(port, hostname);
  });
}
async function runBrowserOAuthLogin(input) {
  const appUrl = normalizeAppUrl(input.appUrl);
  const redirectUri = input.currentState.redirectUri && !input.port ? input.currentState.redirectUri : buildLoopbackRedirectUri(input.port ?? DEFAULT_CALLBACK_PORT);
  const registration = input.currentState.clientId && input.currentState.redirectUri === redirectUri && normalizeAppUrl(input.currentState.appUrl) === appUrl ? { client_id: input.currentState.clientId } : await registerPublicClient({ appUrl, redirectUri });
  const codeVerifier = randomBase64Url(48);
  const codeChallenge = sha256Base64Url(codeVerifier);
  const state = randomBase64Url(24);
  const authorizeUrl = new URL(`${appUrl}/oauth/authorize`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", registration.client_id);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", API_BEARER_SCOPE);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);
  if (input.browser) {
    await openBrowser(authorizeUrl.toString());
  }
  const callback = await waitForCallback({
    redirectUri,
    expectedState: state
  });
  if (callback.error) {
    fail("OAuth authorize step failed.", {
      appUrl,
      authorizeUrl: authorizeUrl.toString(),
      error: callback.error
    });
  }
  if (!callback.code) {
    fail("OAuth authorize step did not return a code.", {
      appUrl,
      authorizeUrl: authorizeUrl.toString()
    });
  }
  const tokens = await exchangeAuthorizationCode({
    appUrl,
    clientId: registration.client_id,
    redirectUri,
    code: callback.code,
    codeVerifier
  });
  return {
    appUrl,
    clientId: registration.client_id,
    redirectUri,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? input.currentState.refreshToken,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1e3).toISOString(),
    authorizeUrl: authorizeUrl.toString()
  };
}

// src/api-client.ts
function isExpired(expiresAt) {
  if (!expiresAt) {
    return true;
  }
  return Date.now() >= new Date(expiresAt).getTime() - 3e4;
}
var InstagramInsightsApiClient = class {
  appUrl;
  constructor(appUrl = DEFAULT_APP_URL) {
    this.appUrl = normalizeAppUrl(appUrl);
  }
  async getAuthState() {
    const state = await readAuthState();
    return {
      ...state,
      appUrl: this.appUrl
    };
  }
  async refreshIfNeeded(state) {
    if (!state.clientId || !state.refreshToken || !state.accessToken || !isExpired(state.expiresAt)) {
      return state;
    }
    const tokens = await refreshAccessToken({
      appUrl: this.appUrl,
      clientId: state.clientId,
      refreshToken: state.refreshToken
    });
    const nextState = {
      ...state,
      appUrl: this.appUrl,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? state.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1e3).toISOString()
    };
    await writeAuthState(nextState);
    return nextState;
  }
  async requireAuthenticatedState() {
    const state = await this.refreshIfNeeded(await this.getAuthState());
    if (!state.accessToken) {
      fail("Authentication required. Run `instagram-insights auth login` first.", {
        appUrl: this.appUrl,
        scope: API_BEARER_SCOPE
      });
    }
    return state;
  }
  async requestJson(path5, init, allowRetry = true) {
    const state = await this.requireAuthenticatedState();
    const response = await fetch(`${this.appUrl}${path5}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${state.accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers ?? {}
      }
    });
    if (response.status === 401 && allowRetry && state.refreshToken && state.clientId) {
      const refreshed = await this.refreshIfNeeded({
        ...state,
        expiresAt: (/* @__PURE__ */ new Date(0)).toISOString()
      });
      return this.requestJson(path5, {
        ...init,
        headers: {
          ...init?.headers ?? {},
          Authorization: `Bearer ${refreshed.accessToken}`
        }
      }, false);
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      fail("Instagram Insights API request failed.", {
        appUrl: this.appUrl,
        path: path5,
        status: response.status,
        response: payload
      });
    }
    return payload;
  }
  getAccountOverview() {
    return this.requestJson("/api/v1/account");
  }
  cleanReset() {
    return this.requestJson(
      "/api/v1/account/clean-reset",
      {
        method: "POST"
      }
    );
  }
  getLatestSnapshot() {
    return this.requestJson("/api/v1/snapshot/latest");
  }
  listMedia(searchParams) {
    return this.requestJson(`/api/v1/media?${searchParams.toString()}`);
  }
  getMedia(mediaId) {
    return this.requestJson(`/api/v1/media/${encodeURIComponent(mediaId)}`);
  }
  getReport(days = 30) {
    return this.requestJson(
      `/api/v1/report?${new URLSearchParams({ days: String(days) }).toString()}`
    );
  }
  listSyncRuns(searchParams) {
    return this.requestJson(
      `/api/v1/sync-runs?${searchParams.toString()}`
    );
  }
  getSyncRun(syncRunId) {
    return this.requestJson(
      `/api/v1/sync-runs/${encodeURIComponent(syncRunId)}`
    );
  }
  triggerSync(payload) {
    return this.requestJson(
      "/api/v1/sync-runs",
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );
  }
};

// src/media-query.ts
function resolveDaysToSinceIso(days, now = /* @__PURE__ */ new Date()) {
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
  return since.toISOString();
}
function buildMediaListSearchParams(input) {
  const searchParams = new URLSearchParams();
  if (input.limit) {
    searchParams.set("limit", String(input.limit));
  }
  if (input.mediaType) {
    searchParams.set("mediaType", input.mediaType);
  }
  if (input.days) {
    searchParams.set("since", resolveDaysToSinceIso(input.days, input.now));
  }
  if (input.since) {
    searchParams.set("since", input.since);
  }
  if (input.until) {
    searchParams.set("until", input.until);
  }
  if (input.flatMetrics) {
    searchParams.set("flatMetrics", "true");
  }
  return searchParams;
}

// src/report-generator.ts
import { mkdir as mkdir4, writeFile as writeFile4 } from "node:fs/promises";
import path4 from "node:path";

// src/report-view-model.ts
var KEYWORD_STOPWORDS = /* @__PURE__ */ new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "being",
  "below",
  "bio",
  "but",
  "by",
  "comment",
  "comments",
  "dm",
  "ep",
  "episode",
  "for",
  "from",
  "get",
  "guide",
  "had",
  "has",
  "have",
  "here",
  "how",
  "i",
  "if",
  "in",
  "into",
  "instagram",
  "is",
  "it",
  "its",
  "join",
  "just",
  "link",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "part",
  "post",
  "posts",
  "reel",
  "reels",
  "setup",
  "so",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "to",
  "today",
  "up",
  "us",
  "using",
  "video",
  "videos",
  "was",
  "we",
  "what",
  "when",
  "where",
  "who",
  "why",
  "with",
  "you",
  "your"
]);
var NUMBER_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "hundred",
  "thousand",
  "million",
  "billion"
];
var AI_KEYWORDS = [
  "ai",
  "anthropic",
  "chatgpt",
  "claude",
  "gpt",
  "llm",
  "models",
  "prompt",
  "prompts"
];
var FINANCE_KEYWORDS = [
  "finance",
  "finances",
  "financial",
  "freedom",
  "income",
  "investor",
  "investing",
  "money",
  "real estate",
  "social security",
  "tax",
  "taxes",
  "wealth",
  "w2"
];
var RELATIONSHIP_KEYWORDS = [
  "couple",
  "couples",
  "husband",
  "marriage",
  "married",
  "partner",
  "partners",
  "wife"
];
var FOUNDER_KEYWORDS = [
  "builder",
  "building",
  "business",
  "ceo",
  "company",
  "founder",
  "founders",
  "revenue",
  "startup",
  "startups"
];
var WOMEN_IN_TECH_KEYWORDS = [
  "conference",
  "female",
  "tech",
  "women"
];
function toDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function normalizeWhitespace(value) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}
function truncate(value, maxLength) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return null;
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trim()}\u2026`;
}
function metricValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function round(value, precision = 1) {
  return Number(value.toFixed(precision));
}
function average(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum2, value) => sum2 + value, 0) / values.length;
}
function averageNullable(values) {
  const defined = values.filter((value) => typeof value === "number");
  if (defined.length === 0) {
    return null;
  }
  return average(defined);
}
function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}
function titleCase(value) {
  return value.toLowerCase().split(/\s+/).filter(Boolean).map((segment) => {
    if (/^\$?\d/.test(segment)) {
      return segment.toUpperCase();
    }
    return `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`;
  }).join(" ");
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function formatDate(date, options) {
  return new Intl.DateTimeFormat("en-US", options).format(date);
}
function buildWindowLabel(report) {
  const since = toDate(report.window.since);
  const until = toDate(report.window.until);
  if (!since || !until) {
    return `${report.window.days}-day window`;
  }
  const sameYear = since.getUTCFullYear() === until.getUTCFullYear();
  const startLabel = formatDate(since, {
    month: "short",
    day: "numeric",
    ...sameYear ? {} : { year: "numeric" }
  });
  const endLabel = formatDate(until, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  return `${startLabel} \u2013 ${endLabel}`;
}
function firstSentence(value) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return null;
  }
  const match = normalized.match(/^.+?[.!?](?=\s|$)/);
  return (match?.[0] ?? normalized).trim();
}
function extractSeriesLabel(caption) {
  if (!caption) {
    return null;
  }
  const lines = caption.split(/\r?\n/).map((line) => normalizeWhitespace(line)).filter(Boolean);
  for (const line of lines) {
    const episodeMatch = line.match(
      /(?:^|\b)(?:ep(?:isode)?\.?\s*\d+\s*[-–—:]?\s*)([A-Za-z0-9$][A-Za-z0-9$ '&/]+)$/i
    );
    if (episodeMatch?.[1]) {
      return titleCase(episodeMatch[1]);
    }
  }
  for (const line of lines) {
    const alphaChars = line.replace(/[^a-z]/gi, "");
    if (!alphaChars) {
      continue;
    }
    const uppercaseChars = alphaChars.replace(/[^A-Z]/g, "").length;
    const uppercaseRatio = uppercaseChars / alphaChars.length;
    const wordCount = line.split(/\s+/).length;
    if (uppercaseRatio >= 0.65 && wordCount >= 2 && wordCount <= 6 && line.length <= 60) {
      return titleCase(line);
    }
  }
  return null;
}
function textIncludesKeyword(text, keywords) {
  return keywords.some((keyword) => {
    if (keyword.includes(" ")) {
      return text.includes(keyword);
    }
    return new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(text);
  });
}
function prettifyStoredTheme(value) {
  const normalized = normalizeWhitespace(value);
  if (!normalized || normalized === "uncategorized") {
    return null;
  }
  if (normalized.includes(" ")) {
    return titleCase(normalized);
  }
  return normalized.slice(0, 1).toUpperCase() + normalized.slice(1);
}
function classifyHookType(input) {
  const primaryText = normalizeWhitespace(
    input.hook ?? firstSentence(input.transcript) ?? firstSentence(input.caption)
  );
  const lower = primaryText.toLowerCase();
  if (!lower) {
    return "Statement Hook";
  }
  const hasNumberWord = NUMBER_WORDS.some(
    (word) => new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(lower)
  );
  if (/[0-9$%]/.test(primaryText) || hasNumberWord) {
    return "Number/Stat Hook";
  }
  if (/\?/.test(primaryText) || /^(did you know|how |what |why |when |where |which |who |if you|you tell me)/i.test(
    primaryText
  )) {
    return "Question/Challenge Hook";
  }
  if (/^(i |i'|i’m|i'm|we |we'|we’re|we're|my |our |as a |as an )/i.test(primaryText) || /\b(my|our|we|i)\b/i.test(primaryText)) {
    return "Personal Story Hook";
  }
  return "Statement Hook";
}
function keywordTokens(value) {
  return normalizeWhitespace(value).replace(/https?:\/\/\S+/gi, " ").replace(/[@#][\w_]+/g, " ").toLowerCase().match(/[a-z][a-z0-9']{2,}/g) ?? [];
}
function extractHashtagsFromCaption(value) {
  if (!value) {
    return [];
  }
  const hashtags = /* @__PURE__ */ new Set();
  const matches = value.matchAll(/(^|\s)#([a-z0-9_]+)/gi);
  for (const match of matches) {
    const tag = (match[2] ?? "").toLowerCase();
    if (tag) {
      hashtags.add(tag);
    }
  }
  return [...hashtags];
}
function buildPostTitle(post) {
  const lines = (post.caption ?? "").split(/\r?\n/).map((line) => normalizeWhitespace(line)).filter(Boolean);
  const firstUsefulLine = lines.find((line) => !/^[@#]/.test(line) && line.length > 3) ?? post.seriesLabel ?? post.hook ?? "Instagram post";
  return truncate(firstUsefulLine, 90) ?? "Instagram post";
}
function classifyPresentationTheme(post, seriesCounts) {
  if (post.seriesLabel && (seriesCounts.get(post.seriesLabel) ?? 0) >= 2) {
    return post.seriesLabel;
  }
  const text = [post.caption, post.hook, post.transcript].map((value) => normalizeWhitespace(value).toLowerCase()).filter(Boolean).join(" ");
  const hasFinance = textIncludesKeyword(text, FINANCE_KEYWORDS);
  const hasRelationship = textIncludesKeyword(text, RELATIONSHIP_KEYWORDS);
  const hasAi = textIncludesKeyword(text, AI_KEYWORDS);
  const hasFounder = textIncludesKeyword(text, FOUNDER_KEYWORDS);
  const hasWomenInTech = textIncludesKeyword(text, WOMEN_IN_TECH_KEYWORDS);
  if (hasFinance && hasRelationship) {
    return "Finance / Relationships";
  }
  if (hasFinance) {
    return "Finance";
  }
  if (hasAi) {
    return "Practical AI";
  }
  if (hasWomenInTech && hasFounder) {
    return "Women in Tech/Founding";
  }
  if (hasFounder) {
    return "Founder / Builder";
  }
  return prettifyStoredTheme(post.storedTheme) ?? "Other";
}
function mergeReportMedia(report, mediaItems) {
  const mergedById = /* @__PURE__ */ new Map();
  for (const reportPost of report.posts) {
    mergedById.set(reportPost.id, {
      reportPost
    });
  }
  for (const media of mediaItems) {
    const current = mergedById.get(media.id) ?? {};
    mergedById.set(media.id, {
      ...current,
      media
    });
  }
  const merged = [...mergedById.entries()].map(([id, value]) => {
    const media = value.media;
    const reportPost = value.reportPost;
    const caption = media?.caption ?? reportPost?.caption ?? null;
    const transcript = media?.transcriptText ?? media?.transcript ?? reportPost?.transcript ?? null;
    const hook = media?.hook ?? reportPost?.hook ?? firstSentence(transcript) ?? firstSentence(caption);
    const postedAt = media?.postedAt ?? reportPost?.postedAt ?? null;
    const engagementRateRaw = typeof media?.engagementRate === "number" ? media.engagementRate : typeof reportPost?.engagementRate === "number" ? reportPost.engagementRate : null;
    const seriesLabel = extractSeriesLabel(caption);
    return {
      id,
      title: "",
      postedAt,
      caption,
      transcript,
      hook,
      hookType: classifyHookType({
        hook,
        transcript,
        caption
      }),
      theme: "",
      seriesLabel,
      permalink: media?.permalink ?? reportPost?.permalink ?? null,
      thumbnailUrl: media?.thumbnailUrl ?? reportPost?.thumbnailUrl ?? null,
      views: metricValue(media?.views ?? reportPost?.views),
      reach: metricValue(media?.reach ?? reportPost?.reach),
      likes: metricValue(media?.likes ?? reportPost?.likes ?? media?.likeCount),
      saves: metricValue(media?.saves ?? reportPost?.saves),
      shares: metricValue(media?.shares ?? reportPost?.shares),
      comments: metricValue(media?.comments ?? reportPost?.comments ?? media?.commentsCount),
      engagementRatePercent: typeof engagementRateRaw === "number" ? round(engagementRateRaw * 100, 1) : null,
      hasTranscript: Boolean(transcript),
      storedTheme: media?.theme ?? reportPost?.theme ?? null,
      hashtags: media?.hashtags && media.hashtags.length > 0 ? media.hashtags : extractHashtagsFromCaption(caption)
    };
  });
  const seriesCounts = /* @__PURE__ */ new Map();
  for (const post of merged) {
    if (!post.seriesLabel) {
      continue;
    }
    seriesCounts.set(post.seriesLabel, (seriesCounts.get(post.seriesLabel) ?? 0) + 1);
  }
  return merged.map((post) => {
    const theme = classifyPresentationTheme(post, seriesCounts);
    return {
      ...post,
      theme,
      title: buildPostTitle({
        caption: post.caption,
        hook: post.hook,
        seriesLabel: post.seriesLabel
      })
    };
  });
}
function buildKeywordPerformance(posts) {
  const stats = /* @__PURE__ */ new Map();
  for (const post of posts) {
    const tokens = keywordTokens(post.caption);
    const filtered = tokens.filter((token) => !KEYWORD_STOPWORDS.has(token));
    const unique = /* @__PURE__ */ new Set();
    for (const token of filtered) {
      unique.add(token);
    }
    for (let index = 0; index < filtered.length - 1; index += 1) {
      unique.add(`${filtered[index]} ${filtered[index + 1]}`);
    }
    for (const keyword of unique) {
      const current = stats.get(keyword) ?? {
        keyword,
        totalViews: 0,
        mentions: 0
      };
      current.totalViews += post.views;
      current.mentions += 1;
      stats.set(keyword, current);
    }
  }
  const ranked = [...stats.values()].filter((keyword) => keyword.mentions >= 2 || keyword.totalViews >= 5e3).sort((a, b) => {
    const wordCountA = a.keyword.split(" ").length;
    const wordCountB = b.keyword.split(" ").length;
    return b.totalViews - a.totalViews || b.mentions - a.mentions || wordCountB - wordCountA || a.keyword.localeCompare(b.keyword);
  });
  const selected = [];
  for (const keyword of ranked) {
    const keywordWords = keyword.keyword.split(" ");
    const isSuppressed = selected.some((existing) => {
      if (keywordWords.length !== 1) {
        return false;
      }
      return existing.keyword.includes(keyword.keyword) && existing.totalViews >= keyword.totalViews * 0.9;
    });
    if (isSuppressed) {
      continue;
    }
    selected.push(keyword);
    if (selected.length === 15) {
      break;
    }
  }
  return selected.map((keyword) => ({
    keyword: keyword.keyword,
    totalViews: keyword.totalViews,
    mentions: keyword.mentions
  }));
}
function buildHashtagPerformance(posts) {
  const stats = /* @__PURE__ */ new Map();
  for (const post of posts) {
    const tags = new Set(
      (post.hashtags && post.hashtags.length > 0 ? post.hashtags : extractHashtagsFromCaption(post.caption)).map((tag) => tag.replace(/^#/, "").toLowerCase()).filter(Boolean)
    );
    for (const tag of tags) {
      const current = stats.get(tag) ?? {
        hashtag: tag,
        totalViews: 0,
        postCount: 0
      };
      current.totalViews += post.views;
      current.postCount += 1;
      stats.set(tag, current);
    }
  }
  return [...stats.values()].sort((a, b) => {
    return b.totalViews - a.totalViews || b.postCount - a.postCount || a.hashtag.localeCompare(b.hashtag);
  }).slice(0, 12);
}
function buildThemePerformance(posts, totalViews) {
  const byTheme = /* @__PURE__ */ new Map();
  for (const post of posts) {
    const grouped = byTheme.get(post.theme) ?? [];
    grouped.push(post);
    byTheme.set(post.theme, grouped);
  }
  return [...byTheme.entries()].map(([label, themedPosts]) => {
    const views = themedPosts.map((post) => post.views);
    const reach = themedPosts.map((post) => post.reach);
    const saves = themedPosts.map((post) => post.saves);
    const shares = themedPosts.map((post) => post.shares);
    const engagementRates = themedPosts.map((post) => post.engagementRatePercent);
    return {
      label,
      totalViews: sum(views),
      totalReach: sum(reach),
      postCount: themedPosts.length,
      avgViews: average(views),
      avgEngagementRatePercent: averageNullable(engagementRates),
      avgSaves: average(saves),
      avgShares: average(shares),
      shareOfViews: totalViews > 0 ? sum(views) / totalViews : 0
    };
  }).sort((a, b) => {
    return b.totalViews - a.totalViews || b.avgViews - a.avgViews || a.label.localeCompare(b.label);
  });
}
function buildHookPerformance(posts) {
  const byHook = /* @__PURE__ */ new Map();
  for (const post of posts) {
    const grouped = byHook.get(post.hookType) ?? [];
    grouped.push(post);
    byHook.set(post.hookType, grouped);
  }
  return [...byHook.entries()].map(([label, hookedPosts]) => {
    const avgViews = average(hookedPosts.map((post) => post.views));
    const bestPost = [...hookedPosts].sort((a, b) => b.views - a.views)[0] ?? null;
    return {
      label,
      avgViews,
      postCount: hookedPosts.length,
      shareOfPosts: posts.length > 0 ? hookedPosts.length / posts.length : 0,
      bestExample: bestPost?.hook ?? bestPost?.title ?? null,
      bestViews: bestPost?.views ?? 0
    };
  }).sort((a, b) => {
    return b.avgViews - a.avgViews || b.postCount - a.postCount || a.label.localeCompare(b.label);
  });
}
function buildPerformancePatterns(input) {
  const rows = [];
  const topTheme = input.themePerformance[0];
  const topHook = input.hookPerformance[0];
  const seriesPosts = input.posts.filter((post) => post.seriesLabel);
  const withTranscripts = input.posts.filter((post) => post.hasTranscript);
  if (topHook) {
    rows.push({
      pattern: `${topHook.label} openings`,
      value: `${formatCompactNumber(topHook.avgViews)} avg views`
    });
  }
  if (topTheme) {
    rows.push({
      pattern: `${topTheme.label} theme`,
      value: `${formatPercent(topTheme.shareOfViews * 100, 0)} of total views`
    });
  }
  if (seriesPosts.length >= 2) {
    rows.push({
      pattern: "Recurring series labels",
      value: `${formatCompactNumber(average(seriesPosts.map((post) => post.views)))} avg views`
    });
  }
  if (withTranscripts.length > 0) {
    rows.push({
      pattern: "Posts with transcript-backed hooks",
      value: `${formatCompactNumber(average(withTranscripts.map((post) => post.views)))} avg views`
    });
  }
  return rows.slice(0, 4);
}
function buildHookGuidance(hookPerformance) {
  const topHook = hookPerformance[0]?.label ?? "Statement Hook";
  return [
    topHook === "Number/Stat Hook" ? {
      title: "Lead with a concrete number",
      body: "Specific numbers, dollar amounts, and percentages are the fastest way to signal a clear payoff."
    } : {
      title: `Lean into ${topHook.replace(" Hook", "").toLowerCase()} framing`,
      body: "The strongest opening pattern in this window is worth repeating with fresh subject matter."
    },
    {
      title: "Keep the first beat short",
      body: "The best-performing hooks land in one fast sentence and make the payoff obvious before the viewer can scroll away."
    },
    {
      title: "Tie the claim to a practical outcome",
      body: "Hooks that quickly connect to money, growth, or a concrete transformation tend to travel farther and earn more saves."
    },
    {
      title: "Make the topic easy to classify",
      body: "Consistent series labels, repeated language, and recognizable themes help viewers know why they should keep watching."
    }
  ];
}
function buildStrategicInsights(input) {
  const { posts, totals, themePerformance, hookPerformance, keywordPerformance } = input;
  const overallAvgViews = totals.avgViews;
  const lowestTheme = [...themePerformance].filter((theme) => theme.postCount >= 2).sort((a, b) => a.avgViews - b.avgViews)[0] ?? null;
  const lowestHook = [...hookPerformance].filter((hook) => hook.postCount >= 2).sort((a, b) => a.avgViews - b.avgViews)[0] ?? null;
  const promisingTheme = [...themePerformance].filter((theme) => theme.postCount <= 2 && theme.avgViews >= overallAvgViews).sort((a, b) => b.avgViews - a.avgViews)[0] ?? null;
  const promisingHook = [...hookPerformance].filter((hook) => hook.postCount <= 2 && hook.avgViews >= overallAvgViews).sort((a, b) => b.avgViews - a.avgViews)[0] ?? null;
  const transcriptlessPosts = posts.filter((post) => !post.hasTranscript);
  const transcriptlessAvgViews = transcriptlessPosts.length > 0 ? average(transcriptlessPosts.map((post) => post.views)) : null;
  const doMoreOf = [];
  const doLessOf = [];
  const untappedOpportunities = [];
  if (themePerformance[0]) {
    doMoreOf.push({
      title: `${themePerformance[0].label} is carrying the period`,
      body: `This theme drove ${formatCompactNumber(themePerformance[0].totalViews)} views across ${themePerformance[0].postCount} posts, or ${formatPercent(themePerformance[0].shareOfViews * 100, 0)} of the total window.`
    });
  }
  if (hookPerformance[0]) {
    doMoreOf.push({
      title: `${hookPerformance[0].label} is the strongest opener`,
      body: `Posts using this hook pattern averaged ${formatCompactNumber(hookPerformance[0].avgViews)} views across ${hookPerformance[0].postCount} posts.`
    });
  }
  const saveHeavyTheme = [...themePerformance].sort((a, b) => b.avgSaves - a.avgSaves)[0] ?? null;
  if (saveHeavyTheme && saveHeavyTheme !== themePerformance[0]) {
    doMoreOf.push({
      title: `${saveHeavyTheme.label} earns strong save behavior`,
      body: `It averages ${formatCompactNumber(saveHeavyTheme.avgSaves)} saves and ${formatCompactNumber(saveHeavyTheme.avgShares)} shares per post, a sign people want to revisit or forward it.`
    });
  }
  if (lowestTheme && lowestTheme.avgViews < overallAvgViews * 0.8) {
    doLessOf.push({
      title: `${lowestTheme.label} is trailing the rest of the mix`,
      body: `It averaged ${formatCompactNumber(lowestTheme.avgViews)} views across ${lowestTheme.postCount} posts versus ${formatCompactNumber(overallAvgViews)} overall.`
    });
  }
  if (lowestHook && lowestHook.avgViews < overallAvgViews * 0.8) {
    doLessOf.push({
      title: `${lowestHook.label} needs a sharper first line`,
      body: `This hook pattern averaged ${formatCompactNumber(lowestHook.avgViews)} views, making it the weakest repeated opening format in the window.`
    });
  }
  if (transcriptlessAvgViews !== null && transcriptlessPosts.length > 0 && transcriptlessAvgViews < overallAvgViews) {
    doLessOf.push({
      title: "Posts without a clear spoken/text hook are lagging",
      body: `Posts missing transcript-backed hooks averaged ${formatCompactNumber(transcriptlessAvgViews)} views, below the ${formatCompactNumber(overallAvgViews)} account average.`
    });
  }
  if (promisingTheme) {
    untappedOpportunities.push({
      title: `${promisingTheme.label} has upside with more volume`,
      body: `It averaged ${formatCompactNumber(promisingTheme.avgViews)} views while only showing up in ${promisingTheme.postCount} posts this period.`
    });
  }
  if (promisingHook) {
    untappedOpportunities.push({
      title: `${promisingHook.label} deserves more repetitions`,
      body: `This hook type averaged ${formatCompactNumber(promisingHook.avgViews)} views but only appeared in ${promisingHook.postCount} posts.`
    });
  }
  if (keywordPerformance[0]) {
    untappedOpportunities.push({
      title: "Repeat the strongest audience language earlier",
      body: `Keywords like \u201C${keywordPerformance[0].keyword}\u201D appeared in posts worth ${formatCompactNumber(keywordPerformance[0].totalViews)} total views, so that phrasing is worth bringing into hooks, covers, and captions.`
    });
  }
  return {
    doMoreOf: doMoreOf.slice(0, 4),
    doLessOf: doLessOf.slice(0, 3),
    untappedOpportunities: untappedOpportunities.slice(0, 4)
  };
}
function buildNumberCallouts(input) {
  const { posts, totals, themePerformance, hookPerformance, starPost } = input;
  const restPosts = starPost ? posts.filter((post) => post.title !== starPost.title) : posts;
  const averageWithoutStar = starPost && restPosts.length > 0 ? average(restPosts.map((post) => post.views)) : null;
  const topHook = hookPerformance[0];
  const dominantTheme = themePerformance[0];
  const coverage = posts.length > 0 ? posts.filter((post) => post.hasTranscript).length / posts.length : 0;
  const callouts = [];
  if (starPost && totals.views > 0) {
    callouts.push({
      value: formatPercent(starPost.views / totals.views * 100, 0),
      description: "of this 30-day window\u2019s total views came from the top post."
    });
  }
  if (dominantTheme) {
    callouts.push({
      value: formatPercent(dominantTheme.shareOfViews * 100, 0),
      description: `of total views came from ${dominantTheme.label}.`
    });
  }
  if (averageWithoutStar !== null) {
    callouts.push({
      value: formatCompactNumber(averageWithoutStar),
      description: "average views per post after removing the top outlier."
    });
  }
  if (topHook && totals.avgViews > 0) {
    callouts.push({
      value: `${round(topHook.avgViews / totals.avgViews, 1)}x`,
      description: `${topHook.label.replace(" Hook", "")} hooks versus the overall average view baseline.`
    });
  } else {
    callouts.push({
      value: formatPercent(coverage * 100, 0),
      description: "of posts included a transcript-backed hook in this window."
    });
  }
  return callouts.slice(0, 4);
}
function formatCompactNumber(value) {
  if (value >= 1e6) {
    return `${round(value / 1e6, 1)}M`;
  }
  if (value >= 1e4) {
    return `${round(value / 1e3, 1)}K`;
  }
  if (value >= 1e3) {
    return `${Math.round(value / 100) / 10}K`;
  }
  return Math.round(value).toLocaleString("en-US");
}
function formatPercent(value, precision = 1) {
  return `${round(value, precision)}%`;
}
function buildDashboardModel(input) {
  const mergedPosts = mergeReportMedia(input.report, input.mediaItems).sort((a, b) => {
    return b.views - a.views || (toDate(b.postedAt)?.getTime() ?? 0) - (toDate(a.postedAt)?.getTime() ?? 0);
  });
  const posts = mergedPosts.map(({ storedTheme, hashtags, ...post }) => {
    void storedTheme;
    void hashtags;
    return post;
  });
  const totals = {
    views: input.report.aggregates.totals.views,
    reach: input.report.aggregates.totals.reach,
    likes: input.report.aggregates.totals.likes,
    saves: input.report.aggregates.totals.saves,
    shares: input.report.aggregates.totals.shares,
    postCount: input.report.aggregates.totals.postCount,
    avgViews: input.report.aggregates.totals.postCount > 0 ? input.report.aggregates.totals.views / input.report.aggregates.totals.postCount : 0,
    avgEngagementRatePercent: typeof input.report.aggregates.totals.avgEngagementRate === "number" ? round(input.report.aggregates.totals.avgEngagementRate * 100, 1) : null
  };
  const starPostSource = posts[0] ?? null;
  const avgWithoutStar = starPostSource && posts.length > 1 ? average(posts.slice(1).map((post) => post.views)) : null;
  const starPost = starPostSource ? {
    title: starPostSource.title,
    hook: starPostSource.hook,
    views: starPostSource.views,
    multiplier: avgWithoutStar && avgWithoutStar > 0 ? round(starPostSource.views / avgWithoutStar, 1) : null,
    theme: starPostSource.theme,
    permalink: starPostSource.permalink
  } : null;
  const themePerformance = buildThemePerformance(posts, totals.views);
  const hookPerformance = buildHookPerformance(posts);
  const keywordPerformance = buildKeywordPerformance(posts);
  const hashtagPerformance = buildHashtagPerformance(
    mergedPosts.map((post) => ({
      caption: post.caption,
      views: post.views,
      hashtags: post.hashtags
    }))
  );
  const strategicInsights = buildStrategicInsights({
    posts,
    totals,
    themePerformance,
    hookPerformance,
    keywordPerformance
  });
  const username = input.account?.username ?? input.report.accountSummary.username ?? "instagram-account";
  return {
    username,
    title: `${username} | Instagram Insights`,
    windowLabel: buildWindowLabel(input.report),
    generatedAtLabel: formatDate(toDate(input.report.generatedAt) ?? /* @__PURE__ */ new Date(), {
      month: "short",
      day: "numeric",
      year: "numeric"
    }),
    postCountLabel: `${totals.postCount} ${totals.postCount === 1 ? "Post" : "Posts"}`,
    totals,
    statCards: [
      {
        label: "Total Views",
        value: totals.views,
        sublabel: `all ${totals.postCount} posts`,
        compact: true
      },
      {
        label: "Total Reach",
        value: totals.reach,
        sublabel: "unique accounts",
        compact: true
      },
      {
        label: "Total Likes",
        value: totals.likes,
        sublabel: "across period"
      },
      {
        label: "Total Saves",
        value: totals.saves,
        sublabel: "bookmarks"
      },
      {
        label: "Total Shares",
        value: totals.shares,
        sublabel: "sends + reposts"
      },
      {
        label: "Posts",
        value: totals.postCount,
        sublabel: `${input.report.window.days}-day window`
      }
    ],
    starPost,
    themePerformance,
    hookPerformance,
    posts,
    keywordPerformance,
    hashtagPerformance,
    topHooks: posts.filter((post) => post.hook).slice(0, 5),
    performancePatterns: buildPerformancePatterns({
      themePerformance,
      hookPerformance,
      posts
    }),
    hookGuidance: buildHookGuidance(hookPerformance),
    strategicInsights,
    numberCallouts: buildNumberCallouts({
      posts,
      totals,
      themePerformance,
      hookPerformance,
      starPost
    })
  };
}

// src/report-html.ts
function escapeHtml(value) {
  return (value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function serializeJsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
function renderEmptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}
function renderThemeBars(items) {
  if (items.length === 0) {
    return renderEmptyState("No themed posts were available for this report window.");
  }
  const maxViews = Math.max(...items.map((item) => item.totalViews), 1);
  return items.map((item) => {
    const width = item.totalViews / maxViews * 100;
    return `
        <div class="bar-item">
          <div class="bar-meta">
            <span class="bar-label">${escapeHtml(item.label)}</span>
            <span class="bar-value">${escapeHtml(
      `${formatCompactNumber(item.totalViews)} views \xB7 ${item.postCount} posts \xB7 ${formatPercent(
        item.shareOfViews * 100,
        0
      )}`
    )}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${width.toFixed(1)}%"></div></div>
        </div>
      `;
  }).join("");
}
function renderHookBars(items) {
  if (items.length === 0) {
    return renderEmptyState("No hook patterns were available for this report window.");
  }
  const maxViews = Math.max(...items.map((item) => item.avgViews), 1);
  return items.map((item, index) => {
    const width = item.avgViews / maxViews * 100;
    return `
        <div class="bar-item">
          <div class="bar-meta">
            <span class="bar-label ${index === 0 ? "bar-label-top" : ""}">${escapeHtml(item.label)}${index === 0 ? ' <span class="top-chip">Top</span>' : ""}</span>
            <span class="bar-value">${escapeHtml(
      `${formatCompactNumber(item.avgViews)} avg \xB7 ${item.postCount} posts`
    )}</span>
          </div>
          <div class="bar-track"><div class="bar-fill alt" style="width:${width.toFixed(1)}%"></div></div>
        </div>
      `;
  }).join("");
}
function renderKeywordBars(items) {
  if (items.length === 0) {
    return renderEmptyState("No repeated caption keywords were strong enough to surface.");
  }
  const maxViews = Math.max(...items.map((item) => item.totalViews), 1);
  return items.map((item, index) => {
    const width = item.totalViews / maxViews * 100;
    return `
        <div class="keyword-item">
          <div class="keyword-rank">${index + 1}</div>
          <div class="keyword-main">
            <div class="keyword-name">${escapeHtml(item.keyword)}</div>
            <div class="keyword-track"><div class="keyword-fill" style="width:${width.toFixed(1)}%"></div></div>
          </div>
          <div class="keyword-value">${escapeHtml(formatCompactNumber(item.totalViews))}</div>
          <div class="keyword-mentions">${escapeHtml(`${item.mentions}x`)}</div>
        </div>
      `;
  }).join("");
}
function renderHashtagTable(model) {
  if (model.hashtagPerformance.length === 0) {
    return renderEmptyState("No hashtags were available for this report window.");
  }
  return `
    <table class="data-table compact-table">
      <thead>
        <tr>
          <th>Hashtag</th>
          <th>Total Views</th>
          <th>Posts</th>
        </tr>
      </thead>
      <tbody>
        ${model.hashtagPerformance.map(
    (item) => `
              <tr>
                <td class="mono">#${escapeHtml(item.hashtag)}</td>
                <td>${escapeHtml(formatCompactNumber(item.totalViews))}</td>
                <td>${item.postCount}</td>
              </tr>
            `
  ).join("")}
      </tbody>
    </table>
  `;
}
function hookToneClass(label) {
  if (label === "Number/Stat Hook") {
    return "tone-number";
  }
  if (label === "Question/Challenge Hook") {
    return "tone-question";
  }
  if (label === "Personal Story Hook") {
    return "tone-story";
  }
  return "tone-statement";
}
function renderHookCards(model) {
  if (model.hookPerformance.length === 0) {
    return renderEmptyState("No hook patterns were available for this report window.");
  }
  return model.hookPerformance.map(
    (item, index) => `
        <div class="hook-card">
          <div class="hook-card-label">${escapeHtml(item.label)}</div>
          <div class="hook-card-avg ${hookToneClass(item.label)}">${escapeHtml(
      formatCompactNumber(item.avgViews)
    )}</div>
          <div class="hook-card-count">
            avg views \xB7 ${item.postCount} posts \xB7 ${escapeHtml(formatPercent(item.shareOfPosts * 100, 0))}
            ${index === 0 ? '<span class="top-chip">Top</span>' : ""}
          </div>
          <div class="hook-card-example">${escapeHtml(item.bestExample ?? "No example available.")}</div>
        </div>
      `
  ).join("");
}
function renderTopHooks(model) {
  if (model.topHooks.length === 0) {
    return renderEmptyState("No hook excerpts were available for this report window.");
  }
  return model.topHooks.map(
    (post, index) => `
        <div class="top-hook-item">
          <div class="top-hook-rank ${index === 0 ? "top-hook-rank-first" : ""}">${index + 1}</div>
          <div class="top-hook-body">
            <div class="top-hook-text">${escapeHtml(post.hook ?? post.title)}</div>
            <div class="top-hook-meta">
              <span class="top-hook-views">${escapeHtml(formatCompactNumber(post.views))} views</span>
              <span class="hook-pill ${hookToneClass(post.hookType)}">${escapeHtml(
      post.hookType.replace(" Hook", "")
    )}</span>
              ${index === 0 ? '<span class="mini-badge mini-badge-hot">Viral</span>' : ""}
            </div>
          </div>
        </div>
      `
  ).join("");
}
function renderPatternTable(rows) {
  if (rows.length === 0) {
    return renderEmptyState("No repeatable performance patterns were strong enough to summarize.");
  }
  return `
    <table class="data-table compact-table">
      <thead>
        <tr>
          <th>Pattern</th>
          <th>Signal</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(
    (row) => `
              <tr>
                <td>${escapeHtml(row.pattern)}</td>
                <td>${escapeHtml(row.value)}</td>
              </tr>
            `
  ).join("")}
      </tbody>
    </table>
  `;
}
function renderInsightList(items, emptyMessage) {
  if (items.length === 0) {
    return renderEmptyState(emptyMessage);
  }
  return `
    <div class="insight-list">
      ${items.map(
    (item, index) => `
            <div class="insight-item">
              <div class="insight-index">${index + 1}</div>
              <div class="insight-body">
                <div class="insight-title">${escapeHtml(item.title)}</div>
                <div class="insight-copy">${escapeHtml(item.body)}</div>
              </div>
            </div>
          `
  ).join("")}
    </div>
  `;
}
function renderNumberCallouts(model) {
  if (model.numberCallouts.length === 0) {
    return renderEmptyState("No quantitative callouts were available for this report window.");
  }
  return `
    <div class="number-grid">
      ${model.numberCallouts.map(
    (item) => `
            <div class="number-card">
              <div class="number-value">${escapeHtml(item.value)}</div>
              <div class="number-copy">${escapeHtml(item.description)}</div>
            </div>
          `
  ).join("")}
    </div>
  `;
}
function renderStarPost(model) {
  if (!model.starPost) {
    return "";
  }
  return `
    <div class="star-card">
      <div class="star-icon">\u2605</div>
      <div class="star-content">
        <div class="star-title">Star Post \u2014 ${escapeHtml(model.starPost.title)}</div>
        <div class="star-copy">
          ${model.starPost.multiplier ? escapeHtml(
    `${model.starPost.multiplier}x above the rest of the set. ${model.starPost.hook ?? ""}`
  ) : escapeHtml(model.starPost.hook ?? "Top-performing post in this report window.")}
        </div>
      </div>
      <div class="star-metric">
        <div class="star-value">${escapeHtml(formatCompactNumber(model.starPost.views))}</div>
        <div class="star-sub">views</div>
      </div>
    </div>
  `;
}
function renderReportHtml(model) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(model.title)}</title>
  <style>
    :root {
      --bg: #f6f7fb;
      --surface: rgba(255, 255, 255, 0.9);
      --surface-strong: #ffffff;
      --border: rgba(15, 23, 42, 0.08);
      --shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      --text: #0f172a;
      --text-muted: #475569;
      --text-soft: #64748b;
      --accent: #ff5c6c;
      --accent-2: #2563eb;
      --accent-soft: rgba(255, 92, 108, 0.12);
      --blue-soft: rgba(37, 99, 235, 0.12);
      --green-soft: rgba(14, 116, 144, 0.12);
      --amber-soft: rgba(217, 119, 6, 0.12);
      --radius: 18px;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(255, 92, 108, 0.12), transparent 30%),
        radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 35%),
        linear-gradient(180deg, #fcfcfe 0%, var(--bg) 100%);
      min-height: 100vh;
    }

    a { color: inherit; }

    .app {
      max-width: 1240px;
      margin: 0 auto;
      padding: 28px 20px 64px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .headline {
      margin: 0;
      font-size: clamp(2rem, 4vw, 2.8rem);
      line-height: 1.04;
      letter-spacing: -0.04em;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .subtitle {
      margin-top: 8px;
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .header-badge {
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      color: var(--text-muted);
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .tabs {
      display: flex;
      gap: 6px;
      padding: 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      margin-bottom: 24px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .tabs::-webkit-scrollbar { display: none; }

    .tab-button {
      border: 0;
      background: transparent;
      color: var(--text-soft);
      padding: 10px 16px;
      border-radius: 999px;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .tab-button.active {
      background: linear-gradient(135deg, rgba(255, 92, 108, 0.18), rgba(37, 99, 235, 0.16));
      color: var(--text);
    }

    .pane { display: none; }
    .pane.active { display: block; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 14px;
      margin-bottom: 22px;
    }

    .card,
    .stat-card,
    .star-card,
    .hook-card,
    .number-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
    }

    .stat-card {
      padding: 18px;
    }

    .stat-label,
    .section-label {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-soft);
    }

    .stat-value {
      margin-top: 10px;
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.05em;
    }

    .stat-sub {
      margin-top: 6px;
      color: var(--text-soft);
      font-size: 0.85rem;
    }

    .star-card {
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 22px;
      background: linear-gradient(135deg, rgba(255, 92, 108, 0.12), rgba(37, 99, 235, 0.12));
    }

    .star-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: rgba(255, 255, 255, 0.72);
      font-size: 1.2rem;
    }

    .star-content {
      flex: 1 1 auto;
      min-width: 0;
    }

    .star-title {
      font-size: 1rem;
      font-weight: 700;
    }

    .star-copy {
      margin-top: 6px;
      color: var(--text-muted);
      font-size: 0.92rem;
    }

    .star-metric {
      text-align: right;
      min-width: 84px;
    }

    .star-value {
      font-size: 1.9rem;
      font-weight: 800;
      color: var(--accent);
      letter-spacing: -0.05em;
    }

    .star-sub {
      color: var(--text-soft);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .two-col {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .card {
      padding: 20px;
    }

    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
    }

    .bar-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .bar-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: baseline;
      margin-bottom: 6px;
    }

    .bar-label {
      font-size: 0.94rem;
      font-weight: 600;
      line-height: 1.3;
    }

    .bar-label-top { color: var(--text); }
    .bar-value { color: var(--text-soft); font-size: 0.85rem; text-align: right; }
    .bar-track {
      height: 9px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.18);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--accent), #fb7185);
    }

    .bar-fill.alt {
      background: linear-gradient(90deg, var(--accent-2), #38bdf8);
    }

    .top-chip,
    .mini-badge,
    .hook-pill,
    .theme-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      line-height: 1;
      padding: 6px 10px;
    }

    .top-chip {
      margin-left: 6px;
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .mini-badge-hot {
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .theme-pill {
      background: rgba(15, 23, 42, 0.08);
      color: var(--text-muted);
    }

    .tone-number {
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .tone-question {
      background: var(--amber-soft);
      color: #b45309;
    }

    .tone-story {
      background: var(--green-soft);
      color: #0f766e;
    }

    .tone-statement {
      background: var(--blue-soft);
      color: #1d4ed8;
    }

    .sort-controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    .sort-button {
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.88);
      color: var(--text-muted);
      border-radius: 999px;
      padding: 9px 14px;
      cursor: pointer;
      font-weight: 600;
    }

    .sort-button.active {
      color: var(--text);
      background: linear-gradient(135deg, rgba(255, 92, 108, 0.12), rgba(37, 99, 235, 0.12));
    }

    .table-shell {
      overflow: hidden;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.88);
      box-shadow: var(--shadow);
    }

    .table-scroll { overflow-x: auto; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 980px;
    }

    .data-table.compact-table {
      min-width: 0;
    }

    .data-table thead th {
      text-align: left;
      padding: 14px 16px;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-soft);
      background: rgba(248, 250, 252, 0.88);
      border-bottom: 1px solid var(--border);
    }

    .data-table tbody td {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      vertical-align: top;
      font-size: 0.93rem;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .post-row {
      cursor: pointer;
    }

    .post-row:hover {
      background: rgba(248, 250, 252, 0.72);
    }

    .rank-pill {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-soft);
      background: rgba(148, 163, 184, 0.14);
    }

    .rank-pill.top {
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .thumb {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      object-fit: cover;
      display: block;
      background: rgba(148, 163, 184, 0.14);
    }

    .thumb-fallback {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: none;
      place-items: center;
      background: rgba(148, 163, 184, 0.14);
      color: var(--text-soft);
      font-size: 1.1rem;
    }

    .post-link {
      color: var(--accent-2);
      text-decoration: none;
      font-weight: 600;
    }

    .expand-row td {
      padding-top: 0;
      background: rgba(248, 250, 252, 0.55);
    }

    .expand-content {
      display: none;
      padding: 0 0 18px;
    }

    .expand-content.open {
      display: block;
    }

    .expand-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      padding: 10px 0 0;
    }

    .expand-label {
      font-size: 0.76rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-soft);
      margin-bottom: 6px;
    }

    .expand-copy {
      color: var(--text-muted);
      line-height: 1.55;
      font-size: 0.92rem;
    }

    .keyword-item {
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr) auto auto;
      gap: 12px;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    }

    .keyword-item:last-child { border-bottom: none; }
    .keyword-rank {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: rgba(15, 23, 42, 0.08);
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .keyword-name { font-weight: 600; }
    .keyword-track {
      height: 8px;
      margin-top: 8px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.18);
      overflow: hidden;
    }

    .keyword-fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--accent), var(--accent-2));
    }

    .keyword-value,
    .keyword-mentions,
    .mono {
      color: var(--text-soft);
      font-size: 0.85rem;
    }

    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

    .hook-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }

    .hook-card {
      padding: 18px;
    }

    .hook-card-label {
      font-size: 0.86rem;
      font-weight: 700;
      color: var(--text-soft);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .hook-card-avg {
      margin-top: 10px;
      font-size: 1.9rem;
      font-weight: 800;
      letter-spacing: -0.05em;
      display: inline-flex;
      padding: 8px 12px;
      border-radius: 14px;
    }

    .hook-card-count {
      margin-top: 12px;
      color: var(--text-soft);
      font-size: 0.88rem;
    }

    .hook-card-example {
      margin-top: 12px;
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .top-hooks {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 18px;
    }

    .top-hook-item {
      display: flex;
      gap: 14px;
      padding: 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }

    .top-hook-rank {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      background: rgba(148, 163, 184, 0.14);
      color: var(--text-muted);
      font-weight: 700;
    }

    .top-hook-rank-first {
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .top-hook-body { min-width: 0; }
    .top-hook-text {
      font-size: 0.97rem;
      font-weight: 600;
      line-height: 1.45;
    }

    .top-hook-meta {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 8px;
      color: var(--text-soft);
      font-size: 0.85rem;
    }

    .insight-section {
      margin-bottom: 18px;
    }

    .insight-section-title {
      margin: 0 0 10px;
      font-size: 1rem;
      font-weight: 700;
    }

    .insight-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .insight-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }

    .insight-index {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      background: rgba(15, 23, 42, 0.08);
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .insight-title {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .insight-copy {
      margin-top: 4px;
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.55;
    }

    .number-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
    }

    .number-card {
      padding: 18px;
    }

    .number-value {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.05em;
    }

    .number-copy {
      margin-top: 8px;
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .empty-state {
      padding: 18px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px dashed rgba(148, 163, 184, 0.35);
      color: var(--text-soft);
      font-size: 0.92rem;
    }

    .spacer-20 { margin-top: 20px; }

    @media (max-width: 900px) {
      .two-col,
      .expand-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .app { padding-left: 14px; padding-right: 14px; }
      .header { align-items: stretch; }
      .star-card { align-items: flex-start; }
      .star-metric { text-align: left; }
      .keyword-item {
        grid-template-columns: 28px minmax(0, 1fr);
      }
      .keyword-value,
      .keyword-mentions {
        grid-column: 2;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="header">
      <div>
        <h1 class="headline">${escapeHtml(model.title)}</h1>
        <div class="subtitle">${escapeHtml(model.windowLabel)} \xB7 ${escapeHtml(model.postCountLabel)} \xB7 Generated ${escapeHtml(model.generatedAtLabel)}</div>
      </div>
      <div class="header-badge">@${escapeHtml(model.username)}</div>
    </header>

    <nav class="tabs" aria-label="Report sections">
      <button class="tab-button active" data-tab="overview">Overview</button>
      <button class="tab-button" data-tab="posts">All Posts</button>
      <button class="tab-button" data-tab="keywords">Keywords</button>
      <button class="tab-button" data-tab="hooks">Hook Patterns</button>
      <button class="tab-button" data-tab="insights">Strategic Insights</button>
    </nav>

    <section class="pane active" id="pane-overview">
      <div class="stat-grid">
        ${model.statCards.map(
    (card) => `
              <article class="stat-card">
                <div class="stat-label">${escapeHtml(card.label)}</div>
                <div class="stat-value">${escapeHtml(
      card.compact ? formatCompactNumber(card.value) : Math.round(card.value).toLocaleString("en-US")
    )}</div>
                <div class="stat-sub">${escapeHtml(card.sublabel)}</div>
              </article>
            `
  ).join("")}
      </div>

      ${renderStarPost(model)}

      <div class="two-col">
        <article class="card">
          <div class="section-heading">
            <div>
              <div class="section-label">Theme View</div>
              <h2 class="section-title">Theme Performance by Views</h2>
            </div>
          </div>
          <div class="bar-stack">${renderThemeBars(model.themePerformance)}</div>
        </article>

        <article class="card">
          <div class="section-heading">
            <div>
              <div class="section-label">Hook View</div>
              <h2 class="section-title">Hook Type Avg Views</h2>
            </div>
          </div>
          <div class="bar-stack">${renderHookBars(model.hookPerformance)}</div>
        </article>
      </div>
    </section>

    <section class="pane" id="pane-posts">
      <div class="sort-controls">
        <button class="sort-button active" data-sort="views">Views</button>
        <button class="sort-button" data-sort="likes">Likes</button>
        <button class="sort-button" data-sort="saves">Saves</button>
        <button class="sort-button" data-sort="shares">Shares</button>
        <button class="sort-button" data-sort="engagementRatePercent">Eng%</button>
        <button class="sort-button" data-sort="postedAt">Date</button>
      </div>

      <div class="table-shell">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Thumb</th>
                <th>Date</th>
                <th>Theme</th>
                <th>Views</th>
                <th>Reach</th>
                <th>Likes</th>
                <th>Saves</th>
                <th>Shares</th>
                <th>Eng%</th>
                <th>Hook</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody id="posts-tbody"></tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="pane" id="pane-keywords">
      <article class="card">
        <div class="section-heading">
          <div>
            <div class="section-label">Keyword View</div>
            <h2 class="section-title">Caption Keywords by Total Views</h2>
          </div>
        </div>
        <div>${renderKeywordBars(model.keywordPerformance)}</div>
      </article>

      <article class="card spacer-20">
        <div class="section-heading">
          <div>
            <div class="section-label">Hashtag View</div>
            <h2 class="section-title">Hashtag Performance</h2>
          </div>
        </div>
        ${renderHashtagTable(model)}
      </article>
    </section>

    <section class="pane" id="pane-hooks">
      <article class="card">
        <div class="section-heading">
          <div>
            <div class="section-label">Hook View</div>
            <h2 class="section-title">Hook Type Performance</h2>
          </div>
        </div>
        <div class="hook-grid">${renderHookCards(model)}</div>

        <div class="section-heading">
          <div>
            <div class="section-label">Top Hooks</div>
            <h2 class="section-title">Top Performing Hooks</h2>
          </div>
        </div>
        <div class="top-hooks">${renderTopHooks(model)}</div>
      </article>

      <article class="card spacer-20">
        <div class="section-heading">
          <div>
            <div class="section-label">Pattern View</div>
            <h2 class="section-title">What Drives Performance</h2>
          </div>
        </div>
        ${renderPatternTable(model.performancePatterns)}
      </article>

      <article class="card spacer-20">
        <div class="section-heading">
          <div>
            <div class="section-label">Hook View</div>
            <h2 class="section-title">What Makes a Great Hook for This Account</h2>
          </div>
        </div>
        ${renderInsightList(
    model.hookGuidance,
    "No hook guidance was available for this report window."
  )}
      </article>
    </section>

    <section class="pane" id="pane-insights">
      <article class="insight-section">
        <h2 class="insight-section-title">Do More Of</h2>
        ${renderInsightList(
    model.strategicInsights.doMoreOf,
    "No repeatable strengths were strong enough to summarize."
  )}
      </article>

      <article class="insight-section">
        <h2 class="insight-section-title">Do Less Of / Reconsider</h2>
        ${renderInsightList(
    model.strategicInsights.doLessOf,
    "No consistent weak spots stood out strongly enough to summarize."
  )}
      </article>

      <article class="insight-section">
        <h2 class="insight-section-title">Untapped Opportunities</h2>
        ${renderInsightList(
    model.strategicInsights.untappedOpportunities,
    "No clear near-term opportunities were strong enough to summarize."
  )}
      </article>

      <article class="insight-section">
        <h2 class="insight-section-title">What the Numbers Say</h2>
        ${renderNumberCallouts(model)}
      </article>
    </section>
  </div>

  <script>
    const POSTS = ${serializeJsonForScript(model.posts)};
    let currentSort = "views";
    let currentDirection = -1;

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function safeUrl(value) {
      if (!value) {
        return "#";
      }

      try {
        const parsed = new URL(value);
        return parsed.toString();
      } catch {
        return "#";
      }
    }

    function compactNumber(value) {
      const numeric = Number(value || 0);

      if (numeric >= 1000000) {
        return (Math.round((numeric / 1000000) * 10) / 10) + "M";
      }

      if (numeric >= 1000) {
        return (Math.round((numeric / 100) ) / 10) + "K";
      }

      return Math.round(numeric).toLocaleString("en-US");
    }

    function integer(value) {
      return Math.round(Number(value || 0)).toLocaleString("en-US");
    }

    function percent(value) {
      if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "\u2014";
      }

      return Number(value).toFixed(1) + "%";
    }

    function hookToneClass(hookType) {
      if (hookType === "Number/Stat Hook") return "tone-number";
      if (hookType === "Question/Challenge Hook") return "tone-question";
      if (hookType === "Personal Story Hook") return "tone-story";
      return "tone-statement";
    }

    function renderTable() {
      const tbody = document.getElementById("posts-tbody");

      if (!tbody) {
        return;
      }

      const sorted = [...POSTS].sort((left, right) => {
        const leftValue = left[currentSort];
        const rightValue = right[currentSort];

        if (currentSort === "postedAt") {
          const leftTime = leftValue ? new Date(leftValue).getTime() : 0;
          const rightTime = rightValue ? new Date(rightValue).getTime() : 0;
          return (leftTime - rightTime) * currentDirection;
        }

        return ((Number(leftValue) || 0) - (Number(rightValue) || 0)) * currentDirection;
      });

      if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12"><div class="empty-state">No posts were available for this report window.</div></td></tr>';
        return;
      }

      tbody.innerHTML = "";

      sorted.forEach((post, index) => {
        const row = document.createElement("tr");
        row.className = "post-row";
        const expandRow = document.createElement("tr");
        expandRow.className = "expand-row";
        const isTop = index === 0;
        const postDate = post.postedAt ? new Date(post.postedAt) : null;
        const label = postDate
          ? postDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "\u2014";
        const permalink = safeUrl(post.permalink);

        row.innerHTML = \`
          <td><div class="rank-pill \${isTop ? "top" : ""}">\${index + 1}</div></td>
          <td>
            <img class="thumb" src="\${escapeHtml(post.thumbnailUrl || "")}" alt="" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
            <div class="thumb-fallback">\u{1F3AC}</div>
          </td>
          <td>\${escapeHtml(label)}</td>
          <td><span class="theme-pill">\${escapeHtml(post.theme)}</span></td>
          <td>\${escapeHtml(compactNumber(post.views))}</td>
          <td>\${escapeHtml(compactNumber(post.reach))}</td>
          <td>\${escapeHtml(integer(post.likes))}</td>
          <td>\${escapeHtml(integer(post.saves))}</td>
          <td>\${escapeHtml(integer(post.shares))}</td>
          <td>\${escapeHtml(percent(post.engagementRatePercent))}</td>
          <td><span class="hook-pill \${hookToneClass(post.hookType)}">\${escapeHtml(post.hookType.replace(" Hook", ""))}</span></td>
          <td>\${permalink === "#" ? "\u2014" : \`<a class="post-link" href="\${escapeHtml(permalink)}" target="_blank" rel="noopener">Open</a>\`}</td>
        \`;

        const expandCell = document.createElement("td");
        expandCell.colSpan = 12;
        expandCell.innerHTML = \`
          <div class="expand-content">
            <div class="expand-grid">
              <div>
                <div class="expand-label">Hook</div>
                <div class="expand-copy">\${escapeHtml(post.hook || "\u2014")}</div>
                <div class="expand-label" style="margin-top: 12px;">Transcript</div>
                <div class="expand-copy">\${escapeHtml(post.transcript || "No transcript stored for this post.")}</div>
              </div>
              <div>
                <div class="expand-label">Caption</div>
                <div class="expand-copy">\${escapeHtml(post.caption || "No caption stored for this post.")}</div>
                <div class="expand-label" style="margin-top: 12px;">Post Title</div>
                <div class="expand-copy">\${escapeHtml(post.title)}</div>
              </div>
            </div>
          </div>
        \`;
        expandRow.appendChild(expandCell);

        row.addEventListener("click", (event) => {
          if (event.target.closest("a")) {
            return;
          }

          const content = expandCell.querySelector(".expand-content");
          const isOpen = content.classList.contains("open");

          tbody.querySelectorAll(".expand-content.open").forEach((item) => item.classList.remove("open"));
          if (!isOpen) {
            content.classList.add("open");
          }
        });

        tbody.appendChild(row);
        tbody.appendChild(expandRow);
      });
    }

    function activateTab(targetId) {
      document.querySelectorAll(".tab-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === targetId);
      });

      document.querySelectorAll(".pane").forEach((pane) => {
        pane.classList.toggle("active", pane.id === "pane-" + targetId);
      });
    }

    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.tab));
    });

    document.querySelectorAll(".sort-button").forEach((button) => {
      button.addEventListener("click", () => {
        const nextSort = button.dataset.sort;

        if (!nextSort) {
          return;
        }

        if (currentSort === nextSort) {
          currentDirection *= -1;
        } else {
          currentSort = nextSort;
          currentDirection = -1;
        }

        document.querySelectorAll(".sort-button").forEach((item) => {
          item.classList.toggle("active", item === button);
        });

        renderTable();
      });
    });

    renderTable();
  </script>
</body>
</html>`;
}

// src/report-generator.ts
function slugify(value) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "account";
}
function toDate2(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function formatFileDate(value) {
  const parsed = toDate2(value) ?? /* @__PURE__ */ new Date();
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
function assertSupportedReportDays(days) {
  if (days !== 30) {
    throw new Error("report generate currently supports only --days 30.");
  }
}
function getReadyReport(response) {
  if (response.status === "not_linked") {
    throw new Error(
      "No linked Instagram account found. Run `instagram-insights instagram link --open` first."
    );
  }
  if (response.status === "not_synced" || !response.report) {
    throw new Error(
      "No synced analysis report is available. Run `instagram-insights sync run --wait` first."
    );
  }
  return response.report;
}
async function listAllReportMedia(input) {
  const items = /* @__PURE__ */ new Map();
  let cursor = null;
  while (true) {
    const searchParams = buildMediaListSearchParams({
      limit: input.limit ?? 100,
      since: input.since,
      until: input.until,
      flatMetrics: true
    });
    if (cursor) {
      searchParams.set("cursor", cursor);
    }
    const response = await input.client.listMedia(searchParams);
    for (const item of response.items) {
      items.set(item.id, item);
    }
    if (!response.nextCursor) {
      break;
    }
    cursor = response.nextCursor;
  }
  return [...items.values()];
}
function buildDefaultReportOutputPath(input) {
  const filename = `instagram-insights-report-${slugify(input.username ?? "account")}-${input.days}d-${formatFileDate(
    input.generatedAt
  )}.html`;
  return path4.resolve(input.cwd ?? process.cwd(), filename);
}
async function generateHtmlReport(input) {
  const days = input.days ?? 30;
  assertSupportedReportDays(days);
  const reportResponse = await input.client.getReport(days);
  const report = getReadyReport(reportResponse);
  const mediaItems = await listAllReportMedia({
    client: input.client,
    since: report.window.since,
    until: report.window.until
  });
  const model = buildDashboardModel({
    account: reportResponse.account,
    report,
    mediaItems
  });
  const html = renderReportHtml(model);
  const resolvedOutputPath = input.outputPath ? path4.resolve(input.cwd ?? process.cwd(), input.outputPath) : buildDefaultReportOutputPath({
    cwd: input.cwd,
    username: model.username,
    generatedAt: report.generatedAt,
    days
  });
  await mkdir4(path4.dirname(resolvedOutputPath), { recursive: true });
  await writeFile4(resolvedOutputPath, `${html}
`, "utf8");
  return {
    outputPath: resolvedOutputPath,
    days,
    username: model.username,
    generatedAt: report.generatedAt,
    postCount: model.posts.length
  };
}

// src/status.ts
function roundHours(hours) {
  return Number(hours.toFixed(1));
}
function deriveSetupStatus(input) {
  const latestSyncRun = input.overview.latestSyncRun;
  const instagramLinkUrl = new URL("/api/login", input.appUrl).toString();
  const developersUrl = new URL("/developers", input.appUrl).toString();
  const latestCompletedAt = latestSyncRun?.completedAt ?? null;
  const ageHours = latestCompletedAt ? roundHours(
    (Date.now() - new Date(latestCompletedAt).getTime()) / (60 * 60 * 1e3)
  ) : null;
  const isActiveSync = Boolean(
    latestSyncRun && ["queued", "running"].includes(latestSyncRun.status)
  );
  const isFresh = ageHours !== null && ageHours < input.staleAfterHours;
  if (!input.overview.account) {
    return {
      status: "not_linked",
      account: null,
      latestSyncRun,
      freshness: {
        staleAfterHours: input.staleAfterHours,
        isFresh: false,
        latestCompletedAt: null,
        ageHours: null,
        summary: "No Instagram account is linked yet."
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "connect_instagram",
      recommendedPrompt: "Run `instagram link --open` to connect Instagram, then rerun `setup status`."
    };
  }
  if (isActiveSync) {
    return {
      status: "syncing",
      account: input.overview.account,
      latestSyncRun,
      freshness: {
        staleAfterHours: input.staleAfterHours,
        isFresh: false,
        latestCompletedAt,
        ageHours,
        summary: `A sync is currently ${latestSyncRun?.status ?? "running"}.`
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "wait_for_sync",
      recommendedPrompt: latestSyncRun?.id ? `Run \`sync get ${latestSyncRun.id}\` or \`sync run --wait\`.` : "Check sync run status again before continuing."
    };
  }
  if (!latestCompletedAt) {
    return {
      status: "not_synced",
      account: input.overview.account,
      latestSyncRun,
      freshness: {
        staleAfterHours: input.staleAfterHours,
        isFresh: false,
        latestCompletedAt: null,
        ageHours: null,
        summary: "No completed sync is available yet."
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "trigger_sync",
      recommendedPrompt: `Run \`sync run --stale-after-hours ${input.staleAfterHours}\`.`
    };
  }
  if (!isFresh) {
    return {
      status: "stale",
      account: input.overview.account,
      latestSyncRun,
      freshness: {
        staleAfterHours: input.staleAfterHours,
        isFresh: false,
        latestCompletedAt,
        ageHours,
        summary: `The latest completed sync is ${ageHours ?? "unknown"} hours old.`
      },
      instagramLinkUrl,
      developersUrl,
      recommendedNextAction: "trigger_sync",
      recommendedPrompt: `Run \`sync run --stale-after-hours ${input.staleAfterHours}\`.`
    };
  }
  return {
    status: "ready",
    account: input.overview.account,
    latestSyncRun,
    freshness: {
      staleAfterHours: input.staleAfterHours,
      isFresh: true,
      latestCompletedAt,
      ageHours,
      summary: "The latest completed sync is fresh enough for analysis."
    },
    instagramLinkUrl,
    developersUrl,
    recommendedNextAction: "analyze",
    recommendedPrompt: "Run `snapshot latest` for account analysis, then `media list` or `media get <id>` for drilldowns."
  };
}

// src/cli-main.ts
var CLI_VERSION = getCliVersion();
var CLI_ARGS = process3.argv.slice(2);
function parseOptionalInt(value, optionName) {
  if (value === void 0 || value === null || value === "") {
    return void 0;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    fail(`Invalid ${optionName}.`, { value });
  }
  return parsed;
}
function getRootOptions(context) {
  const parentOpts = context.parent?.opts?.();
  return {
    appUrl: normalizeAppUrl(parentOpts?.appUrl ?? DEFAULT_APP_URL),
    json: parentOpts?.json === true,
    browser: parentOpts?.browser !== false
  };
}
async function runHandled(task) {
  try {
    await task();
  } catch (error) {
    fail(error instanceof Error ? error.message : "CLI command failed.");
  }
}
async function printPolledSyncRun(client, syncRunId) {
  while (true) {
    const detail = await client.getSyncRun(syncRunId);
    const status = detail.syncRun?.status;
    if (!status || !["queued", "running"].includes(status)) {
      printJson(detail);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
  }
}
function printTopLevelHelp() {
  printText(
    [
      "Instagram Insights CLI",
      "",
      "Commands:",
      "  auth login [--port <n>]",
      "  auth status",
      "  auth logout",
      "  clean-reset",
      "  setup status [--stale-after-hours <n>] [--open-link]",
      "  account overview",
      "  snapshot latest",
      "  media list [--limit <n>] [--media-type <type>] [--since <iso>] [--until <iso>] [--days <n>] [--flat-metrics]",
      "  media get <mediaId>",
      "  media analyze [--days <n>]",
      "  report generate [--days <n>] [--output <path>]",
      "  sync list [--limit <n>]",
      "  sync get <syncRunId>",
      "  sync run [--force] [--stale-after-hours <n>] [--wait]",
      "  instagram link [--open]",
      "  update check [--apply] [--force]",
      "  update apply [--force]",
      "",
      "Global options:",
      "  --app-url <url>",
      "  --json",
      "  --no-browser"
    ].join("\n")
  );
}
var InstagramInsightsCli = class {
  async run() {
    if (CLI_ARGS.length === 0) {
      printTopLevelHelp();
    }
  }
  async auth(action) {
    await runHandled(async () => {
      const root = getRootOptions(this);
      if (action === "status") {
        const state = await readAuthState();
        printJson({
          authenticated: Boolean(state.accessToken),
          appUrl: root.appUrl,
          clientId: state.clientId,
          redirectUri: state.redirectUri,
          expiresAt: state.expiresAt,
          hasRefreshToken: Boolean(state.refreshToken)
        });
        return;
      }
      if (action === "logout") {
        await clearAuthTokens();
        printJson({
          loggedOut: true,
          appUrl: root.appUrl
        });
        return;
      }
      if (action === "login") {
        const currentState = await readAuthState();
        const port = parseOptionalInt(this.port, "port");
        const nextState = await runBrowserOAuthLogin({
          appUrl: root.appUrl,
          browser: root.browser,
          currentState: {
            ...currentState,
            appUrl: root.appUrl
          },
          port
        });
        await writeAuthState(nextState);
        printJson({
          authenticated: true,
          appUrl: nextState.appUrl,
          clientId: nextState.clientId,
          redirectUri: nextState.redirectUri,
          expiresAt: nextState.expiresAt
        });
        return;
      }
      fail("Unsupported auth action.", { action });
    });
  }
  async setup(action) {
    await runHandled(async () => {
      if (action !== "status") {
        fail("Unsupported setup action.", { action });
      }
      const root = getRootOptions(this);
      const staleAfterHours = parseOptionalInt(
        this.staleAfterHours,
        "stale-after-hours"
      ) ?? DEFAULT_STALE_AFTER_HOURS;
      const client = new InstagramInsightsApiClient(root.appUrl);
      const overview = await client.getAccountOverview();
      const setupStatus = deriveSetupStatus({
        overview,
        appUrl: root.appUrl,
        staleAfterHours
      });
      if (setupStatus.status === "not_linked" && this.openLink && root.browser) {
        await openBrowser(setupStatus.instagramLinkUrl);
      }
      printJson(setupStatus);
    });
  }
  async ["clean-reset"]() {
    await runHandled(async () => {
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(await client.cleanReset());
    });
  }
  async account(action) {
    await runHandled(async () => {
      if (action !== "overview") {
        fail("Unsupported account action.", { action });
      }
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(await client.getAccountOverview());
    });
  }
  async snapshot(action) {
    await runHandled(async () => {
      if (action !== "latest") {
        fail("Unsupported snapshot action.", { action });
      }
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(await client.getLatestSnapshot());
    });
  }
  async media(action, mediaId) {
    await runHandled(async () => {
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      if (action === "get") {
        if (!mediaId) {
          fail("media get requires a mediaId.");
        }
        printJson(await client.getMedia(mediaId));
        return;
      }
      if (action === "list") {
        const options = this;
        const limit = parseOptionalInt(options.limit, "limit");
        const days = parseOptionalInt(options.days, "days");
        const searchParams = buildMediaListSearchParams({
          limit,
          mediaType: options.mediaType,
          since: options.since,
          until: options.until,
          days: days ?? void 0,
          flatMetrics: options.flatMetrics === true
        });
        printJson(await client.listMedia(searchParams));
        return;
      }
      if (action === "analyze") {
        const days = parseOptionalInt(
          this.days,
          "days"
        ) ?? 30;
        if (days !== 30) {
          fail("media analyze currently supports only --days 30.", { days });
        }
        printJson(await client.getReport(days));
        return;
      }
      fail("Unsupported media action.", { action });
    });
  }
  async sync(action, syncRunId) {
    await runHandled(async () => {
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      if (action === "list") {
        const limit = parseOptionalInt(
          this.limit,
          "limit"
        );
        const searchParams = new URLSearchParams();
        if (limit) {
          searchParams.set("limit", String(limit));
        }
        printJson(await client.listSyncRuns(searchParams));
        return;
      }
      if (action === "get") {
        if (!syncRunId) {
          fail("sync get requires a syncRunId.");
        }
        printJson(await client.getSyncRun(syncRunId));
        return;
      }
      if (action === "run") {
        const options = this;
        const payload = {
          force: options.force === true,
          staleAfterHours: parseOptionalInt(options.staleAfterHours, "stale-after-hours") ?? DEFAULT_STALE_AFTER_HOURS
        };
        const result = await client.triggerSync(payload);
        if (options.wait) {
          const queuedId = "syncRunId" in result ? result.syncRunId : "syncRun" in result && result.syncRun && typeof result.syncRun === "object" ? String(result.syncRun.id ?? "") : "";
          if (!queuedId) {
            printJson(result);
            return;
          }
          await printPolledSyncRun(client, queuedId);
          return;
        }
        printJson(result);
        return;
      }
      fail("Unsupported sync action.", { action });
    });
  }
  async report(action) {
    await runHandled(async () => {
      if (action !== "generate") {
        fail("Unsupported report action.", { action });
      }
      const options = this;
      const days = parseOptionalInt(options.days, "days") ?? 30;
      const client = new InstagramInsightsApiClient(getRootOptions(this).appUrl);
      printJson(
        await generateHtmlReport({
          client,
          days,
          outputPath: options.output
        })
      );
    });
  }
  async instagram(action) {
    await runHandled(async () => {
      if (action !== "link") {
        fail("Unsupported instagram action.", { action });
      }
      const root = getRootOptions(this);
      const instagramLinkUrl = new URL("/api/login", root.appUrl).toString();
      const shouldOpen = root.browser && (this.open ?? true);
      if (shouldOpen) {
        await openBrowser(instagramLinkUrl);
      }
      printJson({
        instagramLinkUrl,
        openedInBrowser: shouldOpen
      });
    });
  }
  async update(action) {
    await runHandled(async () => {
      const options = this;
      const force = options.force === true;
      const shouldApply = action === "apply" || options.apply === true;
      const result = await checkForUpdates({
        allowCache: false,
        force
      });
      if (action !== "check" && action !== "apply") {
        fail("Unsupported update action.", { action });
      }
      if (!shouldApply) {
        printJson(result);
        return;
      }
      const applyResult = await applyUpdate(result, {
        force
      });
      printJson({
        ...result,
        apply: applyResult
      });
    });
  }
};
__decorateClass([
  (0, import_commander_ts.option)("--app-url <url>", "Use a different Instagram Insights app URL")
], InstagramInsightsCli.prototype, "appUrl", 2);
__decorateClass([
  (0, import_commander_ts.option)("--json", "Accepted for compatibility; data commands already default to JSON")
], InstagramInsightsCli.prototype, "json", 2);
__decorateClass([
  (0, import_commander_ts.option)("--no-browser", "Disable automatic browser launch")
], InstagramInsightsCli.prototype, "browser", 2);
__decorateClass([
  (0, import_commander_ts.command)(),
  (0, import_commander_ts.commandOption)("--port <n>", "Use a specific localhost callback port"),
  __decorateParam(0, (0, import_commander_ts.requiredArg)("action"))
], InstagramInsightsCli.prototype, "auth", 1);
__decorateClass([
  (0, import_commander_ts.command)(),
  (0, import_commander_ts.commandOption)("--stale-after-hours <n>", "Freshness threshold in hours"),
  (0, import_commander_ts.commandOption)("--open-link", "Open the Instagram linking handoff when status is not_linked"),
  __decorateParam(0, (0, import_commander_ts.requiredArg)("action"))
], InstagramInsightsCli.prototype, "setup", 1);
__decorateClass([
  (0, import_commander_ts.command)()
], InstagramInsightsCli.prototype, "clean-reset", 1);
__decorateClass([
  (0, import_commander_ts.command)(),
  __decorateParam(0, (0, import_commander_ts.requiredArg)("action"))
], InstagramInsightsCli.prototype, "account", 1);
__decorateClass([
  (0, import_commander_ts.command)(),
  __decorateParam(0, (0, import_commander_ts.requiredArg)("action"))
], InstagramInsightsCli.prototype, "snapshot", 1);
__decorateClass([
  (0, import_commander_ts.command)(),
  (0, import_commander_ts.commandOption)("--limit <n>", "Maximum number of items to fetch"),
  (0, import_commander_ts.commandOption)("--media-type <type>", "Filter by media type"),
  (0, import_commander_ts.commandOption)("--since <iso>", "Only include media posted at or after this ISO timestamp"),
  (0, import_commander_ts.commandOption)("--until <iso>", "Only include media posted at or before this ISO timestamp"),
  (0, import_commander_ts.commandOption)("--days <n>", "Only include media from the trailing N days"),
  (0, import_commander_ts.commandOption)("--flat-metrics", "Include stored flat metrics and analysis fields"),
  __decorateParam(0, (0, import_commander_ts.requiredArg)("action")),
  __decorateParam(1, (0, import_commander_ts.optionalArg)("mediaId"))
], InstagramInsightsCli.prototype, "media", 1);
__decorateClass([
  (0, import_commander_ts.command)(),
  (0, import_commander_ts.commandOption)("--limit <n>", "Maximum number of sync runs to fetch"),
  (0, import_commander_ts.commandOption)("--force", "Force a new sync even when data is fresh"),
  (0, import_commander_ts.commandOption)("--stale-after-hours <n>", "Freshness threshold in hours"),
  (0, import_commander_ts.commandOption)("--wait", "Poll until the sync reaches a terminal state"),
  __decorateParam(0, (0, import_commander_ts.requiredArg)("action")),
  __decorateParam(1, (0, import_commander_ts.optionalArg)("syncRunId"))
], InstagramInsightsCli.prototype, "sync", 1);
__decorateClass([
  (0, import_commander_ts.command)(),
  (0, import_commander_ts.commandOption)("--days <n>", "Report window in days"),
  (0, import_commander_ts.commandOption)("--output <path>", "Write the generated HTML report to this path"),
  __decorateParam(0, (0, import_commander_ts.requiredArg)("action"))
], InstagramInsightsCli.prototype, "report", 1);
__decorateClass([
  (0, import_commander_ts.command)(),
  (0, import_commander_ts.commandOption)("--open", "Open the Instagram linking handoff in the browser"),
  __decorateParam(0, (0, import_commander_ts.requiredArg)("action"))
], InstagramInsightsCli.prototype, "instagram", 1);
__decorateClass([
  (0, import_commander_ts.command)(),
  (0, import_commander_ts.commandOption)("--apply", "Apply the update immediately after checking"),
  (0, import_commander_ts.commandOption)("--force", "Reinstall the published version even when versions match"),
  __decorateParam(0, (0, import_commander_ts.requiredArg)("action"))
], InstagramInsightsCli.prototype, "update", 1);
InstagramInsightsCli = __decorateClass([
  (0, import_commander_ts.program)(),
  (0, import_commander_ts.version)(CLI_VERSION),
  (0, import_commander_ts.description)("Instagram Insights skill CLI"),
  (0, import_commander_ts.usage)("[global options] <command> [subcommand]")
], InstagramInsightsCli);
function runCli() {
  new InstagramInsightsCli();
}

// src/index.ts
async function main() {
  const args = process.argv.slice(2);
  if (canAutoUpdate(args)) {
    const result = await checkForUpdates({
      allowCache: true,
      force: false
    });
    if (result.updateAvailable) {
      try {
        const applyResult = await applyUpdate(result);
        if (applyResult.applied) {
          await relaunchCli(args);
          return;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to apply automatic updates.";
        console.error(`[instagram-insights:update] ${message}`);
      }
    }
  }
  runCli();
}
void main().catch((error) => {
  const message = error instanceof Error ? error.message : "CLI execution failed.";
  console.error(message);
  process.exit(1);
});
/*! Bundled license information:

reflect-metadata/Reflect.js:
  (*! *****************************************************************************
  Copyright (C) Microsoft. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0
  
  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.
  
  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** *)
*/
