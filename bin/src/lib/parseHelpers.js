// Generated by CoffeeScript 1.10.0
(function() {
  var AMQPTypes;

  AMQPTypes = require('./constants').AMQPTypes;

  module.exports = {
    parseIntFromBuffer: function(buffer, size) {
      switch (size) {
        case 1:
          return buffer[buffer.read++];
        case 2:
          return (buffer[buffer.read++] << 8) + buffer[buffer.read++];
        case 4:
          return (buffer[buffer.read++] << 24) + (buffer[buffer.read++] << 16) + (buffer[buffer.read++] << 8) + buffer[buffer.read++];
        case 8:
          return (buffer[buffer.read++] << 56) + (buffer[buffer.read++] << 48) + (buffer[buffer.read++] << 40) + (buffer[buffer.read++] << 32) + (buffer[buffer.read++] << 24) + (buffer[buffer.read++] << 16) + (buffer[buffer.read++] << 8) + buffer[buffer.read++];
        default:
          throw new Error("cannot parse ints of that size");
      }
    },
    parseTable: function(buffer) {
      var length, table;
      length = buffer.read + module.exports.parseIntFromBuffer(buffer, 4);
      table = {};
      while (buffer.read < length) {
        table[module.exports.parseShortString(buffer)] = module.exports.parseValue(buffer);
      }
      return table;
    },
    parseFields: function(buffer, fields) {
      var args, bitIndex, field, i, j, len1, ref, value;
      args = {};
      bitIndex = 0;
      for (i = j = 0, len1 = fields.length; j < len1; i = ++j) {
        field = fields[i];
        switch (field.domain) {
          case 'bit':
            value = (ref = buffer[buffer.read] & (1 << bitIndex)) != null ? ref : {
              "true": false
            };
            if (fields[i + 1] && fields[i + 1].domain === 'bit') {
              bitIndex++;
            } else {
              bitIndex = 0;
              buffer.read++;
            }
            break;
          case 'octet':
            value = buffer[buffer.read++];
            break;
          case 'short':
            value = module.exports.parseIntFromBuffer(buffer, 2);
            break;
          case 'long':
            value = module.exports.parseIntFromBuffer(buffer, 4);
            break;
          case 'timestamp':
          case 'longlong':
            value = module.exports.parseIntFromBuffer(buffer, 8);
            break;
          case 'shortstr':
            value = module.exports.parseShortString(buffer);
            break;
          case 'longstr':
            value = module.exports.parseLongString(buffer);
            break;
          case 'table':
            value = module.exports.parseTable(buffer);
            break;
          default:
            throw new Error("Unhandled parameter type " + field.domain);
        }
        args[field.name] = value;
      }
      return args;
    },
    parseShortString: function(buffer) {
      var length, s;
      length = buffer[buffer.read++];
      s = buffer.toString('utf8', buffer.read, buffer.read + length);
      buffer.read += length;
      return s;
    },
    parseLongString: function(buffer) {
      var length, s;
      length = module.exports.parseIntFromBuffer(buffer, 4);
      s = buffer.slice(buffer.read, buffer.read + length);
      buffer.read += length;
      return s.toString();
    },
    parseSignedInteger: function(buffer) {
      var int;
      int = module.exports.parseIntFromBuffer(buffer, 4);
      if (int & 0x80000000) {
        int |= 0xEFFFFFFF;
        int = -int;
      }
      return int;
    },
    parseValue: function(buffer) {
      var arr, b, buf, dec, end, i, int, j, k, len, num;
      switch (buffer[buffer.read++]) {
        case AMQPTypes.STRING:
          return module.exports.parseLongString(buffer);
        case AMQPTypes.INTEGER:
          return module.exports.parseIntFromBuffer(buffer, 4);
        case AMQPTypes.DECIMAL:
          dec = module.exports.parseIntFromBuffer(buffer, 1);
          num = module.exports.parseIntFromBuffer(buffer, 4);
          return num / (dec * 10);
        case AMQPTypes._64BIT_FLOAT:
          b = [];
          for (i = j = 0; j < 8; i = ++j) {
            b[i] = buffer[buffer.read++];
          }
          return (new jspack(true)).Unpack('d', b);
        case AMQPTypes._32BIT_FLOAT:
          b = [];
          for (i = k = 0; k < 4; i = ++k) {
            b[i] = buffer[buffer.read++];
          }
          return (new jspack(true)).Unpack('f', b);
        case AMQPTypes.TIME:
          int = module.exports.parseIntFromBuffer(buffer, 8);
          return (new Date()).setTime(int * 1000);
        case AMQPTypes.HASH:
          return module.exports.parseTable(buffer);
        case AMQPTypes.SIGNED_64BIT:
          return module.exports.parseIntFromBuffer(buffer, 8);
        case AMQPTypes.BOOLEAN:
          return module.exports.parseIntFromBuffer(buffer, 1) > 0;
        case AMQPTypes.BYTE_ARRAY:
          len = module.exports.parseIntFromBuffer(buffer, 4);
          buf = new Buffer(len);
          buffer.copy(buf, 0, buffer.read, buffer.read + len);
          buffer.read += len;
          return buf;
        case AMQPTypes.ARRAY:
          len = module.exports.parseIntFromBuffer(buffer, 4);
          end = buffer.read + len;
          arr = new Array();
          while (buffer.read < end) {
            arr.push(module.exports.parseValue(buffer));
          }
          return arr;
        default:
          throw new Error("Unknown field value type " + buffer[buffer.read - 1]);
      }
    }
  };

}).call(this);
