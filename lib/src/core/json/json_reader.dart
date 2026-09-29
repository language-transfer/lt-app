/// Strict, path-aware reading of decoded JSON.
///
/// The backend's JSON is small and its shape is fixed, so it is parsed by
/// hand instead of with code generation. Every accessor throws a
/// [FormatException] that names the exact location of the problem, for
/// example `courses[3].meta.filesize`.
library;

import 'dart:convert';

/// Decodes JSON text, naming [what] in the error if it is not valid JSON.
Object? decodeJson(String source, String what) {
  try {
    return jsonDecode(source);
  } on FormatException catch (error) {
    throw FormatException('Invalid JSON in $what: ${error.message}');
  }
}

/// A JSON object together with its location in the document.
class JsonObject {
  JsonObject(Object? value, this.path)
    : _map = value is Map<String, Object?>
          ? value
          : throw FormatException('Expected an object at $path');

  final Map<String, Object?> _map;
  final String path;

  String _at(String key) => path.isEmpty ? key : '$path.$key';

  Object? _require(String key) {
    if (!_map.containsKey(key)) {
      throw FormatException('Missing ${_at(key)}');
    }
    return _map[key];
  }

  String string(String key) {
    final value = _require(key);
    if (value is! String) {
      throw FormatException('Expected a string at ${_at(key)}');
    }
    return value;
  }

  int integer(String key) {
    final value = _require(key);
    // Whole numbers decode as int; anything else is not an integer.
    if (value is! int) {
      throw FormatException('Expected an integer at ${_at(key)}');
    }
    return value;
  }

  double number(String key) {
    final value = _require(key);
    if (value is! num) {
      throw FormatException('Expected a number at ${_at(key)}');
    }
    return value.toDouble();
  }

  JsonObject object(String key) => JsonObject(_require(key), _at(key));

  JsonObject? optionalObject(String key) =>
      _map[key] == null ? null : JsonObject(_map[key], _at(key));

  List<JsonObject> objects(String key) {
    final value = _require(key);
    if (value is! List<Object?>) {
      throw FormatException('Expected a list at ${_at(key)}');
    }
    return [
      for (var i = 0; i < value.length; i++)
        JsonObject(value[i], '${_at(key)}[$i]'),
    ];
  }

  /// Reads an integer that must equal [expected], such as a format version.
  void expectInteger(String key, int expected) {
    final actual = integer(key);
    if (actual != expected) {
      throw FormatException(
        'Unsupported ${_at(key)}: expected $expected, found $actual',
      );
    }
  }
}
