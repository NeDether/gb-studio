import type { ScriptEventDef } from "lib/scriptEventsHandlers/handlerTypes";
import type {
  ScriptEventArgs,
  ScriptEventFieldSchema,
} from "shared/lib/entities/entitiesTypes";
import {
  isUnionPropertyValue,
  isUnionVariableValue,
} from "shared/lib/entities/entitiesHelpers";

export type ScriptEventDefs = Record<string, ScriptEventDef>;

const SECTION_TAB_KEY = "__section";

export const isFieldVisible = (
  field: ScriptEventFieldSchema,
  args: ScriptEventArgs,
  ignoreConditions?: string[],
) => {
  if (!field.conditions) {
    return true;
  }
  // Determine if field conditions are met
  return field.conditions.reduce((memo, condition) => {
    if (ignoreConditions?.includes(condition.key)) {
      return memo;
    }
    const keyValue = args[condition.key];
    return (
      memo &&
      (!condition.eq || keyValue === condition.eq) &&
      (!condition.ne || keyValue !== condition.ne) &&
      (!condition.gt || Number(keyValue) > Number(condition.gt)) &&
      (!condition.gte || Number(keyValue) >= Number(condition.gte)) &&
      (!condition.lt || Number(keyValue) > Number(condition.lt)) &&
      (!condition.lte || Number(keyValue) >= Number(condition.lte)) &&
      (!condition.in ||
        condition.in.indexOf(keyValue) >= 0 ||
        (keyValue === undefined && condition.in.indexOf(null) >= 0)) &&
      (condition.set === undefined ||
        (condition.set && keyValue !== undefined) ||
        (!condition.set && keyValue === undefined))
    );
  }, true);
};

const getField = (
  cmd: string,
  fieldName: string,
  scriptEventDefs: ScriptEventDefs,
): ScriptEventFieldSchema | undefined => {
  const event = scriptEventDefs[cmd];
  if (!event) return undefined;
  return event.fieldsLookup[fieldName];
};

export const isVariableField = (
  command: string,
  fieldName: string,
  args: ScriptEventArgs,
  scriptEventDefs: ScriptEventDefs,
) => {
  const field = getField(command, fieldName, scriptEventDefs);
  const argValue = args[fieldName];
  return (
    !!field &&
    (field.type === "variable" || isUnionVariableValue(argValue)) &&
    isFieldVisible(field, args, [SECTION_TAB_KEY])
  );
};

export const isActorField = (
  cmd: string,
  fieldName: string,
  args: ScriptEventArgs,
  scriptEventDefs: ScriptEventDefs,
) => {
  // Custom event calls
  if (fieldName.startsWith("$actor[")) {
    return true;
  }
  const field = getField(cmd, fieldName, scriptEventDefs);
  return (
    !!field &&
    field.type === "actor" &&
    isFieldVisible(field, args, [SECTION_TAB_KEY])
  );
};

export const isPropertyField = (
  cmd: string,
  fieldName: string,
  args: ScriptEventArgs,
  scriptEventDefs: ScriptEventDefs,
) => {
  const event = scriptEventDefs[cmd];
  if (!event) return false;
  const field = getField(cmd, fieldName, scriptEventDefs);
  const fieldValue = args[fieldName];
  return (
    !!field &&
    (field.type === "property" || isUnionPropertyValue(fieldValue)) &&
    isFieldVisible(field, args, [SECTION_TAB_KEY])
  );
};

export const isScriptValueField = (
  cmd: string,
  fieldName: string,
  args: ScriptEventArgs,
  scriptEventDefs: ScriptEventDefs,
) => {
  // Custom event calls
  if (fieldName.startsWith("$variable[")) {
    return true;
  }
  const event = scriptEventDefs[cmd];
  if (!event) return false;
  const field = getField(cmd, fieldName, scriptEventDefs);
  return (
    field &&
    field.type === "value" &&
    isFieldVisible(field, args, [SECTION_TAB_KEY])
  );
};
