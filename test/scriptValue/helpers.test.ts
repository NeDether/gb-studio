import {
  PrecompiledValueFetch,
  ScriptValue,
} from "../../src/shared/lib/scriptValue/types";
import {
  addScriptValueConst,
  addScriptValueToScriptValue,
  expressionToScriptValue,
  extractScriptValueVariables,
  multiplyScriptValueConst,
  optimiseScriptValue,
  precompileScriptValue,
  someInScriptValue,
  sortFetchOperations,
  variableInScriptValue,
  walkScriptValue,
} from "../../src/shared/lib/scriptValue/helpers";

test("should perform constant folding for addition", () => {
  const input: ScriptValue = {
    type: "add",
    valueA: {
      type: "number",
      value: 5,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 8,
  });
});

test("should not perform constant folding when one or more inputs is not constant", () => {
  const input: ScriptValue = {
    type: "add",
    valueA: {
      type: "number",
      value: 5,
    },
    valueB: {
      type: "variable",
      value: "L0",
    },
  };
  const input2: ScriptValue = {
    type: "add",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "number",
      value: 5,
    },
  };
  const input3: ScriptValue = {
    type: "add",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "variable",
      value: "L0",
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "add",
    valueA: {
      type: "number",
      value: 5,
    },
    valueB: {
      type: "variable",
      value: "L0",
    },
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "add",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "number",
      value: 5,
    },
  });
  expect(optimiseScriptValue(input3)).toEqual({
    type: "add",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "variable",
      value: "L0",
    },
  });
});

test("should perform constant folding for subtraction", () => {
  const input: ScriptValue = {
    type: "sub",
    valueA: {
      type: "number",
      value: 5,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 2,
  });
});

test("should perform constant folding for multiplication", () => {
  const input: ScriptValue = {
    type: "mul",
    valueA: {
      type: "number",
      value: 5,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 15,
  });
});

test("should perform constant folding for division", () => {
  const input: ScriptValue = {
    type: "div",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 7,
  });
});

test("should round down to nearest int when constant folding for division", () => {
  const input: ScriptValue = {
    type: "div",
    valueA: {
      type: "number",
      value: 14,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 4,
  });
});

test("should perform constant folding for modulo", () => {
  const input: ScriptValue = {
    type: "mod",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 8,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 5,
  });
});

test("should perform constant folding for greater than", () => {
  const input: ScriptValue = {
    type: "gt",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  const input2: ScriptValue = {
    type: "gt",
    valueA: {
      type: "number",
      value: 3,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 1,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 0,
  });
});

test("should perform constant folding for greater than or equal to", () => {
  const input: ScriptValue = {
    type: "gte",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  const input2: ScriptValue = {
    type: "gte",
    valueA: {
      type: "number",
      value: 3,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  const input3: ScriptValue = {
    type: "gte",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 1,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 0,
  });
  expect(optimiseScriptValue(input3)).toEqual({
    type: "number",
    value: 1,
  });
});

test("should perform constant folding for less than", () => {
  const input: ScriptValue = {
    type: "lt",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  const input2: ScriptValue = {
    type: "lt",
    valueA: {
      type: "number",
      value: 3,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 0,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 1,
  });
});

test("should perform constant folding for less than or equal to", () => {
  const input: ScriptValue = {
    type: "lte",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  const input2: ScriptValue = {
    type: "lte",
    valueA: {
      type: "number",
      value: 3,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  const input3: ScriptValue = {
    type: "lte",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 0,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 1,
  });
  expect(optimiseScriptValue(input3)).toEqual({
    type: "number",
    value: 1,
  });
});

test("should perform constant folding for equal to", () => {
  const input: ScriptValue = {
    type: "eq",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  const input2: ScriptValue = {
    type: "eq",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 20,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 1,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 0,
  });
});

test("should perform constant folding for not equal to", () => {
  const input: ScriptValue = {
    type: "ne",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  const input2: ScriptValue = {
    type: "ne",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 20,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 0,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 1,
  });
});

test("should perform constant folding for min", () => {
  const input: ScriptValue = {
    type: "min",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  const input2: ScriptValue = {
    type: "min",
    valueA: {
      type: "number",
      value: 3,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 3,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 3,
  });
});

test("should perform constant folding for max", () => {
  const input: ScriptValue = {
    type: "max",
    valueA: {
      type: "number",
      value: 21,
    },
    valueB: {
      type: "number",
      value: 3,
    },
  };
  const input2: ScriptValue = {
    type: "max",
    valueA: {
      type: "number",
      value: 3,
    },
    valueB: {
      type: "number",
      value: 21,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 21,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 21,
  });
});

test("should perform constant folding for 'and'", () => {
  const input: ScriptValue = {
    type: "and",
    valueA: {
      type: "number",
      value: 1,
    },
    valueB: {
      type: "number",
      value: 0,
    },
  };
  const input2: ScriptValue = {
    type: "and",
    valueA: {
      type: "number",
      value: 3,
    },
    valueB: {
      type: "number",
      value: 1,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 0,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 1,
  });
});

test("should perform constant folding for 'or'", () => {
  const input: ScriptValue = {
    type: "or",
    valueA: {
      type: "number",
      value: 1,
    },
    valueB: {
      type: "number",
      value: 0,
    },
  };
  const input2: ScriptValue = {
    type: "or",
    valueA: {
      type: "number",
      value: 0,
    },
    valueB: {
      type: "number",
      value: 0,
    },
  };
  const input3: ScriptValue = {
    type: "or",
    valueA: {
      type: "number",
      value: 1,
    },
    valueB: {
      type: "number",
      value: 5,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 1,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 0,
  });
  expect(optimiseScriptValue(input3)).toEqual({
    type: "number",
    value: 1,
  });
});

test("should perform constant folding for shift left", () => {
  const input: ScriptValue = {
    type: "shl",
    valueA: {
      type: "number",
      value: 3,
    },
    valueB: {
      type: "number",
      value: 4,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 48,
  });
});

test("should perform constant folding for shift right", () => {
  const input: ScriptValue = {
    type: "shr",
    valueA: {
      type: "number",
      value: 48,
    },
    valueB: {
      type: "number",
      value: 4,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 3,
  });
});

test("should perform constant folding for binary AND", () => {
  const input: ScriptValue = {
    type: "bAND",
    valueA: {
      type: "number",
      value: 85,
    },
    valueB: {
      type: "number",
      value: 240,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 80,
  });
});

test("should perform constant folding for binary OR", () => {
  const input: ScriptValue = {
    type: "bOR",
    valueA: {
      type: "number",
      value: 85,
    },
    valueB: {
      type: "number",
      value: 240,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 245,
  });
});

test("should perform constant folding for binary XOR", () => {
  const input: ScriptValue = {
    type: "bXOR",
    valueA: {
      type: "number",
      value: 85,
    },
    valueB: {
      type: "number",
      value: 240,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 165,
  });
});

test("should perform constant folding for atan2", () => {
  const input: ScriptValue = {
    type: "atan2",
    valueA: {
      type: "number",
      value: 8,
    },
    valueB: {
      type: "number",
      value: 10,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 91,
  });
});

test("should perform constant folding for 'not'", () => {
  const input: ScriptValue = {
    type: "not",
    value: {
      type: "number",
      value: 8,
    },
  };
  const input2: ScriptValue = {
    type: "not",
    value: {
      type: "number",
      value: 0,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 0,
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "number",
    value: 1,
  });
});

test("should perform constant folding for 'abs'", () => {
  const input: ScriptValue = {
    type: "abs",
    value: {
      type: "number",
      value: -7,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 7,
  });
});

test("should perform constant folding for integer sqrt", () => {
  const input: ScriptValue = {
    type: "isqrt",
    value: {
      type: "number",
      value: 29,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 5,
  });
});

test("should perform constant folding for binary NOT", () => {
  const input: ScriptValue = {
    type: "bNOT",
    value: {
      type: "number",
      value: 85,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: -86,
  });
});

test("should perform constant folding for rnd function's input but perform calculation at runtime", () => {
  const input: ScriptValue = {
    type: "rnd",
    value: {
      type: "add",
      valueA: {
        type: "number",
        value: 5,
      },
      valueB: {
        type: "number",
        value: 3,
      },
    },
  };
  const input2: ScriptValue = {
    type: "rnd",
    value: {
      type: "number",
      value: 85,
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "rnd",
    value: {
      type: "number",
      value: 8,
    },
  });
  expect(optimiseScriptValue(input2)).toEqual({
    type: "rnd",
    value: {
      type: "number",
      value: 85,
    },
  });
});

test("should convert expressions to script values when optimising", () => {
  const input: ScriptValue = {
    type: "expression",
    value: "$00$ + 8",
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "add",
    valueA: {
      type: "variable",
      value: "0",
    },
    valueB: {
      type: "number",
      value: 8,
    },
  });
});

test("should perform constant folding for nested input", () => {
  const input: ScriptValue = {
    type: "mul",
    valueA: {
      type: "sub",
      valueA: {
        type: "number",
        value: 5,
      },
      valueB: {
        type: "number",
        value: 3,
      },
    },
    valueB: {
      type: "add",
      valueA: {
        type: "number",
        value: 5,
      },
      valueB: {
        type: "min",
        valueA: {
          type: "number",
          value: 3,
        },
        valueB: {
          type: "number",
          value: 6,
        },
      },
    },
  };
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 16,
  });
});

test("should replace missing values with 0", () => {
  const input: ScriptValue = {
    type: "add",
    valueA: {
      type: "variable",
      value: "5",
    },
  } as ScriptValue;
  expect(optimiseScriptValue(input)).toEqual({
    type: "add",
    valueA: {
      type: "variable",
      value: "5",
    },
    valueB: {
      type: "number",
      value: 0,
    },
  });
});

test("should replace missing values with 0 and collapse where possible", () => {
  const input: ScriptValue = {
    type: "add",
    valueA: {
      type: "number",
      value: 5,
    },
  } as ScriptValue;
  expect(optimiseScriptValue(input)).toEqual({
    type: "number",
    value: 5,
  });
});

test("should precompile to list of required operations", () => {
  const input: ScriptValue = {
    type: "add",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "variable",
      value: "L0",
    },
  };
  expect(precompileScriptValue(input)).toEqual([
    [
      {
        type: "variable",
        value: "L0",
      },
      {
        type: "variable",
        value: "L0",
      },
      {
        type: "add",
      },
    ],
    [],
  ]);
});

test("should precompile to list of required operations", () => {
  const input: ScriptValue = {
    type: "add",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "property",
      target: "player",
      property: "xpos",
    },
  };
  expect(precompileScriptValue(input)).toEqual([
    [
      {
        type: "variable",
        value: "L0",
      },
      {
        type: "local",
        value: "local_0",
        offset: 1,
      },
      {
        type: "number",
        value: 7,
      },
      {
        type: "shr",
      },
      {
        type: "add",
      },
    ],
    [
      {
        local: "local_0",
        value: {
          type: "actorPosition",
          target: "player",
        },
      },
    ],
  ]);
});

test("should convert expression ($00$ + 8) to script value", () => {
  const input = "$00$ + 8";
  expect(expressionToScriptValue(input)).toEqual({
    type: "add",
    valueA: {
      type: "variable",
      value: "0",
    },
    valueB: {
      type: "number",
      value: 8,
    },
  });
});

test("should convert expression ($L0$ + 8) to script value", () => {
  const input = "$L0$ + 8";
  expect(expressionToScriptValue(input)).toEqual({
    type: "add",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "number",
      value: 8,
    },
  });
});

test("should convert expression ($V0$ + 8) to script value", () => {
  const input = "$V0$ + 8";
  expect(expressionToScriptValue(input)).toEqual({
    type: "add",
    valueA: {
      type: "variable",
      value: "V0",
    },
    valueB: {
      type: "number",
      value: 8,
    },
  });
});

test("should convert expression (!($V0$)) to script value", () => {
  const input = "!($V0$)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "not",
    value: {
      type: "variable",
      value: "V0",
    },
  });
});

test("should convert expression (!!($V0$)) to script value", () => {
  const input = "!!($V0$)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "not",
    value: {
      type: "not",
      value: {
        type: "variable",
        value: "V0",
      },
    },
  });
});

test("should convert expression (!(!($V0$))) to script value", () => {
  const input = "!(!($V0$))";
  expect(expressionToScriptValue(input)).toEqual({
    type: "not",
    value: {
      type: "not",
      value: {
        type: "variable",
        value: "V0",
      },
    },
  });
});

test("should convert expression (~($V0$)) to script value", () => {
  const input = "~($V0$)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "bNOT",
    value: {
      type: "variable",
      value: "V0",
    },
  });
});

test("should convert expression (~~($V0$)) to script value", () => {
  const input = "~~($V0$)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "bNOT",
    value: {
      type: "bNOT",
      value: {
        type: "variable",
        value: "V0",
      },
    },
  });
});

test("should convert expression (min($L0$, 10)) to script value", () => {
  const input = "min($L0$, 10)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "min",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "number",
      value: 10,
    },
  });
});

test("should convert expression (max($L0$, 10)) to script value", () => {
  const input = "max($L0$, 10)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "max",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "number",
      value: 10,
    },
  });
});

test("should convert expression (abs($L0$)) to script value", () => {
  const input = "abs($L0$)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "abs",
    value: {
      type: "variable",
      value: "L0",
    },
  });
});

test("should convert expression (rnd($L0$)) to script value", () => {
  const input = "rnd($L0$)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "rnd",
    value: {
      type: "variable",
      value: "L0",
    },
  });
});

test("should convert expression (isqrt($L0$)) to script value", () => {
  const input = "isqrt($L0$)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "isqrt",
    value: {
      type: "variable",
      value: "L0",
    },
  });
});

test("should convert expression (atan2($L0$, 10)) to script value", () => {
  const input = "atan2($L0$, 10)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "atan2",
    valueA: {
      type: "variable",
      value: "L0",
    },
    valueB: {
      type: "number",
      value: 10,
    },
  });
});

test("should return zero when converting (* 8) to script value", () => {
  const input = "* 8";
  expect(expressionToScriptValue(input)).toEqual({
    type: "number",
    value: 0,
  });
});

test("should return zero when converting min(5,) to script value", () => {
  const input = "min(5,)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "number",
    value: 0,
  });
});

test("should convert expression (-5) to script value", () => {
  const input = "-5";
  expect(expressionToScriptValue(input)).toEqual({
    type: "sub",
    valueA: {
      type: "number",
      value: 0,
    },
    valueB: {
      type: "number",
      value: 5,
    },
  });
});

test("should convert expression (10-5) to script value", () => {
  const input = "10-5";
  expect(expressionToScriptValue(input)).toEqual({
    type: "sub",
    valueA: {
      type: "number",
      value: 10,
    },
    valueB: {
      type: "number",
      value: 5,
    },
  });
});

test("should convert expression (10+(-5)) to script value", () => {
  const input = "10+(-5)";
  expect(expressionToScriptValue(input)).toEqual({
    type: "add",
    valueA: {
      type: "number",
      value: 10,
    },
    valueB: {
      type: "sub",
      valueA: {
        type: "number",
        value: 0,
      },
      valueB: {
        type: "number",
        value: 5,
      },
    },
  });
});

test("should convert expression (true || false) to script value", () => {
  const input = "true || false";
  expect(expressionToScriptValue(input)).toEqual({
    type: "or",
    valueA: {
      type: "number",
      value: 1,
    },
    valueB: {
      type: "number",
      value: 0,
    },
  });
});

test("should convert invalid expression to zero script value", () => {
  const input = "($00$ + 8";
  expect(expressionToScriptValue(input)).toEqual({
    type: "number",
    value: 0,
  });
});

test("should add two script values", () => {
  const inputA: ScriptValue = {
    type: "variable",
    value: "0",
  };
  const inputB: ScriptValue = {
    type: "number",
    value: 5,
  };
  expect(addScriptValueToScriptValue(inputA, inputB)).toEqual({
    type: "add",
    valueA: {
      type: "variable",
      value: "0",
    },
    valueB: {
      type: "number",
      value: 5,
    },
  });
});

test("should add a const number to a script value", () => {
  const inputA: ScriptValue = {
    type: "variable",
    value: "0",
  };
  expect(addScriptValueConst(inputA, 12)).toEqual({
    type: "add",
    valueA: {
      type: "variable",
      value: "0",
    },
    valueB: {
      type: "number",
      value: 12,
    },
  });
});

test("should multiply a const number with a script value", () => {
  const inputA: ScriptValue = {
    type: "variable",
    value: "0",
  };
  expect(multiplyScriptValueConst(inputA, 8)).toEqual({
    type: "mul",
    valueA: {
      type: "variable",
      value: "0",
    },
    valueB: {
      type: "number",
      value: 8,
    },
  });
});

test("should sort fetch operations so that properties on same target/prop are grouped together", () => {
  const input: PrecompiledValueFetch[] = [
    {
      local: "tmp1",
      value: {
        type: "actorPosition",
        target: "actor1",
      },
    },
    {
      local: "tmp2",
      value: {
        type: "actorPosition",
        target: "actor2",
      },
    },
    {
      local: "tmp3",
      value: {
        type: "actorPosition",
        target: "actor1",
      },
    },
    {
      local: "tmp4",
      value: {
        type: "actorPosition",
        target: "actor1",
      },
    },
  ];
  expect(sortFetchOperations(input)).toEqual([
    {
      local: "tmp1",
      value: {
        type: "actorPosition",
        target: "actor1",
      },
    },
    {
      local: "tmp3",
      value: {
        type: "actorPosition",
        target: "actor1",
      },
    },
    {
      local: "tmp4",
      value: {
        type: "actorPosition",
        target: "actor1",
      },
    },
    {
      local: "tmp2",
      value: {
        type: "actorPosition",
        target: "actor2",
      },
    },
  ]);
});

describe("walkScriptValue", () => {
  const logValues = (input: ScriptValue): string[] => {
    const values: string[] = [];
    walkScriptValue(input, (val) => values.push(val.type));
    return values;
  };

  test("should walk through a simple add operation", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "number",
        value: 5,
      },
      valueB: {
        type: "number",
        value: 3,
      },
    };
    expect(logValues(input)).toEqual(["add", "number", "number"]);
  });

  test("should walk through nested operations", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "sub",
        valueA: {
          type: "number",
          value: 5,
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
      valueB: {
        type: "add",
        valueA: {
          type: "number",
          value: 5,
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
    };
    expect(logValues(input)).toEqual([
      "mul",
      "sub",
      "number",
      "number",
      "add",
      "number",
      "number",
    ]);
  });

  test("should walk through unary operation", () => {
    const input: ScriptValue = {
      type: "not",
      value: {
        type: "number",
        value: 1,
      },
    };
    expect(logValues(input)).toEqual(["not", "number"]);
  });

  test("should walk through unary operation with nested binary operation", () => {
    const input: ScriptValue = {
      type: "not",
      value: {
        type: "add",
        valueA: {
          type: "number",
          value: 1,
        },
        valueB: {
          type: "number",
          value: 2,
        },
      },
    };
    expect(logValues(input)).toEqual(["not", "add", "number", "number"]);
  });

  test("should handle complex nested structure", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "sub",
        valueA: {
          type: "add",
          valueA: {
            type: "number",
            value: 2,
          },
          valueB: {
            type: "number",
            value: 3,
          },
        },
        valueB: {
          type: "number",
          value: 1,
        },
      },
      valueB: {
        type: "div",
        valueA: {
          type: "number",
          value: 10,
        },
        valueB: {
          type: "number",
          value: 2,
        },
      },
    };
    expect(logValues(input)).toEqual([
      "mul",
      "sub",
      "add",
      "number",
      "number",
      "number",
      "div",
      "number",
      "number",
    ]);
  });
});

describe("extractScriptValueVariables", () => {
  test("should extract single variable from a simple add operation", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "variable",
        value: "V0",
      },
      valueB: {
        type: "number",
        value: 3,
      },
    };
    expect(extractScriptValueVariables(input)).toEqual(["V0"]);
  });

  test("should extract multiple variables from nested operations", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "sub",
        valueA: {
          type: "variable",
          value: "V1",
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
      valueB: {
        type: "add",
        valueA: {
          type: "variable",
          value: "V2",
        },
        valueB: {
          type: "variable",
          value: "V3",
        },
      },
    };
    expect(extractScriptValueVariables(input)).toEqual(["V1", "V2", "V3"]);
  });

  test("should handle unary operation with variable", () => {
    const input: ScriptValue = {
      type: "not",
      value: {
        type: "variable",
        value: "V4",
      },
    };
    expect(extractScriptValueVariables(input)).toEqual(["V4"]);
  });

  test("should handle operation with no variables", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "number",
        value: 5,
      },
      valueB: {
        type: "number",
        value: 3,
      },
    };
    expect(extractScriptValueVariables(input)).toEqual([]);
  });

  test("should extract variables from complex nested structure", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "sub",
        valueA: {
          type: "add",
          valueA: {
            type: "variable",
            value: "V5",
          },
          valueB: {
            type: "variable",
            value: "V6",
          },
        },
        valueB: {
          type: "variable",
          value: "V7",
        },
      },
      valueB: {
        type: "div",
        valueA: {
          type: "variable",
          value: "V8",
        },
        valueB: {
          type: "variable",
          value: "V9",
        },
      },
    };
    expect(extractScriptValueVariables(input)).toEqual([
      "V5",
      "V6",
      "V7",
      "V8",
      "V9",
    ]);
  });

  test("should extract variables from expression", () => {
    const input: ScriptValue = {
      type: "expression",
      value: "42 * ($10$ * $V4$) + $T0$",
    };
    expect(extractScriptValueVariables(input)).toEqual(["10", "V4", "T0"]);
  });

  test("should extract variables from nested expressions", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "expression",
        value: "$V1$ * ($V2$ + $V3$)",
      },
      valueB: {
        type: "expression",
        value: "($V4$ - $V5$) / $V6$",
      },
    };
    expect(extractScriptValueVariables(input)).toEqual([
      "V1",
      "V2",
      "V3",
      "V4",
      "V5",
      "V6",
    ]);
  });

  test("should handle expression with no variables", () => {
    const input: ScriptValue = {
      type: "expression",
      value: "42 * (3 + 5)",
    };
    expect(extractScriptValueVariables(input)).toEqual([]);
  });

  test("should handle complex expression with variables", () => {
    const input: ScriptValue = {
      type: "expression",
      value: "42 * ($10$ * $V4$) + $T0$ + min($L1$, 10)",
    };
    expect(extractScriptValueVariables(input)).toEqual([
      "10",
      "V4",
      "T0",
      "L1",
    ]);
  });

  test("should handle nested expression within operation", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "expression",
        value: "$V1$ * 3",
      },
      valueB: {
        type: "sub",
        valueA: {
          type: "expression",
          value: "$V2$ + 5",
        },
        valueB: {
          type: "variable",
          value: "V3",
        },
      },
    };
    expect(extractScriptValueVariables(input)).toEqual(["V1", "V2", "V3"]);
  });
});

describe("someInScriptValue", () => {
  test("should return true for a simple add operation with a matching node", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "variable",
        value: "V0",
      },
      valueB: {
        type: "number",
        value: 3,
      },
    };
    const result = someInScriptValue(
      input,
      (node) => node.type === "number" && node.value === 3,
    );
    expect(result).toBe(true);
  });

  test("should return false for a simple add operation with no matching node", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "variable",
        value: "V0",
      },
      valueB: {
        type: "number",
        value: 3,
      },
    };
    const result = someInScriptValue(
      input,
      (node) => node.type === "number" && node.value === 4,
    );
    expect(result).toBe(false);
  });

  test("should return true for a nested operation with a matching node", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "add",
        valueA: {
          type: "number",
          value: 2,
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
      valueB: {
        type: "number",
        value: 5,
      },
    };
    const result = someInScriptValue(
      input,
      (node) => node.type === "number" && node.value === 5,
    );
    expect(result).toBe(true);
  });

  test("should return false for a nested operation with no matching node", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "add",
        valueA: {
          type: "number",
          value: 2,
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
      valueB: {
        type: "number",
        value: 5,
      },
    };
    const result = someInScriptValue(
      input,
      (node) => node.type === "number" && node.value === 10,
    );
    expect(result).toBe(false);
  });

  test("should return true for a unary operation with a matching node", () => {
    const input: ScriptValue = {
      type: "not",
      value: {
        type: "true",
      },
    };
    const result = someInScriptValue(input, (node) => node.type === "true");
    expect(result).toBe(true);
  });

  test("should return false for a unary operation with no matching node", () => {
    const input: ScriptValue = {
      type: "not",
      value: {
        type: "true",
      },
    };
    const result = someInScriptValue(input, (node) => node.type === "false");
    expect(result).toBe(false);
  });

  test("should return true when root node itself matches", () => {
    const input: ScriptValue = {
      type: "true",
    };
    const result = someInScriptValue(input, (node) => node.type === "true");
    expect(result).toBe(true);
  });

  test("should handle complex nested operations", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "mul",
        valueA: {
          type: "variable",
          value: "V0",
        },
        valueB: {
          type: "div",
          valueA: {
            type: "number",
            value: 6,
          },
          valueB: {
            type: "number",
            value: 2,
          },
        },
      },
      valueB: {
        type: "sub",
        valueA: {
          type: "number",
          value: 10,
        },
        valueB: {
          type: "number",
          value: 4,
        },
      },
    };
    const result = someInScriptValue(
      input,
      (node) => node.type === "variable" && node.value === "V0",
    );
    expect(result).toBe(true);
  });

  test("should exit early on first matching node in simple add operation", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "number",
        value: 3,
      },
      valueB: {
        type: "number",
        value: 4,
      },
    };

    const mockFn = jest.fn(
      (node) => node.type === "number" && node.value === 3,
    );

    const result = someInScriptValue(input, mockFn);

    expect(result).toBe(true);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test("should exit early on first matching node in nested operation", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "add",
        valueA: {
          type: "number",
          value: 2,
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
      valueB: {
        type: "number",
        value: 5,
      },
    };

    const mockFn = jest.fn(
      (node) => node.type === "number" && node.value === 3,
    );

    const result = someInScriptValue(input, mockFn);

    expect(result).toBe(true);
    expect(mockFn).toHaveBeenCalledTimes(4);
  });

  test("should exit early on first matching node in complex nested operation", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "mul",
        valueA: {
          type: "variable",
          value: "V0",
        },
        valueB: {
          type: "div",
          valueA: {
            type: "number",
            value: 6,
          },
          valueB: {
            type: "number",
            value: 2,
          },
        },
      },
      valueB: {
        type: "sub",
        valueA: {
          type: "number",
          value: 10,
        },
        valueB: {
          type: "number",
          value: 4,
        },
      },
    };

    const mockFn = jest.fn(
      (node) => node.type === "number" && node.value === 6,
    );

    const result = someInScriptValue(input, mockFn);

    expect(result).toBe(true);
    expect(mockFn).toHaveBeenCalledTimes(5);
  });

  test("should exit early on first matching node even if it's a unary operation", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "not",
        value: {
          type: "true",
        },
      },
      valueB: {
        type: "false",
      },
    };

    const mockFn = jest.fn((node) => node.type === "true");

    const result = someInScriptValue(input, mockFn);

    expect(result).toBe(true);
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});

describe("variableInScriptValue", () => {
  test("should return true when variable is found in a simple add operation", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "variable",
        value: "V0",
      },
      valueB: {
        type: "number",
        value: 3,
      },
    };

    const result = variableInScriptValue("V0", input);
    expect(result).toBe(true);
  });

  test("should return false when variable is not found in a simple add operation", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "variable",
        value: "V1",
      },
      valueB: {
        type: "number",
        value: 3,
      },
    };

    const result = variableInScriptValue("V0", input);
    expect(result).toBe(false);
  });

  test("should return true when variable is found in a nested operation", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "add",
        valueA: {
          type: "variable",
          value: "V0",
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
      valueB: {
        type: "number",
        value: 5,
      },
    };

    const result = variableInScriptValue("V0", input);
    expect(result).toBe(true);
  });

  test("should return false when variable is not found in a nested operation", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: {
        type: "add",
        valueA: {
          type: "variable",
          value: "V1",
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
      valueB: {
        type: "number",
        value: 5,
      },
    };

    const result = variableInScriptValue("V0", input);
    expect(result).toBe(false);
  });

  test("should return true when variable is found in an expression", () => {
    const input: ScriptValue = {
      type: "expression",
      value: "5 + $V0$",
    };

    const result = variableInScriptValue("V0", input);
    expect(result).toBe(true);
  });

  test("should return false when variable is not found in an expression", () => {
    const input: ScriptValue = {
      type: "expression",
      value: "10 * $V1$",
    };

    const result = variableInScriptValue("V0", input);
    expect(result).toBe(false);
  });

  test("should handle complex nested operations", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "mul",
        valueA: {
          type: "variable",
          value: "V0",
        },
        valueB: {
          type: "div",
          valueA: {
            type: "number",
            value: 6,
          },
          valueB: {
            type: "number",
            value: 2,
          },
        },
      },
      valueB: {
        type: "sub",
        valueA: {
          type: "number",
          value: 10,
        },
        valueB: {
          type: "number",
          value: 4,
        },
      },
    };

    const result = variableInScriptValue("V0", input);
    expect(result).toBe(true);
  });

  test("should return false if variable not present in complex nested operations", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "mul",
        valueA: {
          type: "variable",
          value: "V1",
        },
        valueB: {
          type: "div",
          valueA: {
            type: "number",
            value: 6,
          },
          valueB: {
            type: "number",
            value: 2,
          },
        },
      },
      valueB: {
        type: "sub",
        valueA: {
          type: "number",
          value: 10,
        },
        valueB: {
          type: "number",
          value: 4,
        },
      },
    };

    const result = variableInScriptValue("V0", input);
    expect(result).toBe(false);
  });
});
