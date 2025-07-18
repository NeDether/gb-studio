import cloneDeep from "lodash/cloneDeep";
import {
  migrateFrom410r1To420r1Event,
  migrateFrom420r1To420r2Event,
  migrateFrom420r2To420r3EngineFields,
  migrateFrom420r2To420r3Event,
} from "lib/project/migration/versions/410to420";
import {
  EngineFieldValue,
  ScriptEvent,
} from "shared/lib/entities/entitiesTypes";
import { CompressedProjectResources } from "shared/lib/resources/types";
import { dummyCompressedProjectResources } from "../../dummydata";

describe("migrateFrom410r1To420r1Event", () => {
  test("Should convert EVENT_SWITCH values to const values", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_SWITCH",
      args: {
        value1: 1,
        value2: 10,
        value3: 100,
      },
    };
    const output = migrateFrom410r1To420r1Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.value1).toEqual({
      type: "number",
      value: 1,
    });
    expect(output.args?.value2).toEqual({
      type: "number",
      value: 10,
    });
    expect(output.args?.value3).toEqual({
      type: "number",
      value: 100,
    });
    expect(output.args?.value4).toEqual({
      type: "number",
      value: 5,
    });
    expect(output.args?.value15).toEqual({
      type: "number",
      value: 16,
    });
    expect(output.args?.value16).toBeUndefined();
  });

  test("Should not mutate input", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_SWITCH",
      args: {
        value1: 1,
        value2: 10,
        value3: 100,
      },
    };
    const inputClone = cloneDeep(input);
    migrateFrom410r1To420r1Event(input);
    expect(input).toEqual(inputClone);
  });

  test("Should not modify non-switch events", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_FOO",
      args: {
        value1: 1,
        value2: 10,
        value3: 100,
      },
    };
    const output = migrateFrom410r1To420r1Event(input);
    expect(output).toEqual(input);
  });
});

describe("migrateFrom420r1To420r2Event", () => {
  test("Should convert EVENT_WAIT seconds to const values", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "time",
        time: 10.4,
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.time).toEqual({
      type: "number",
      value: 10.4,
    });
    expect(output.args?.units).toEqual("time");
  });

  test("Should convert EVENT_WAIT frames to const values", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "frames",
        frames: 12,
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.frames).toEqual({
      type: "number",
      value: 12,
    });
    expect(output.args?.units).toEqual("frames");
  });

  test("Should convert EVENT_WAIT both frames and time fields to const values", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "frames",
        time: 10.4,
        frames: 12,
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.frames).toEqual({
      type: "number",
      value: 12,
    });
    expect(output.args?.time).toEqual({
      type: "number",
      value: 10.4,
    });
    expect(output.args?.units).toEqual("frames");
  });

  test("Should convert EVENT_WAIT using default values if missing", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "frames",
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.frames).toEqual({
      type: "number",
      value: 30,
    });
    expect(output.args?.time).toEqual({
      type: "number",
      value: 0.5,
    });
    expect(output.args?.units).toEqual("frames");
  });

  test("Should not mutate input", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "frames",
        frames: 12,
      },
    };
    const inputClone = cloneDeep(input);
    migrateFrom420r1To420r2Event(input);
    expect(input).toEqual(inputClone);
  });

  test("Should not modify non-wait events", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_FOO",
      args: {
        value1: 1,
        value2: 10,
        value3: 100,
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output).toEqual(input);
  });
});

describe("migrateFrom420r2To420r3Event", () => {
  test("should migrate EVENT_ACTOR_MOVE_TO event", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        useCollisions: true,
        moveType: "horizontal",
        units: "tiles",
      },
    };
    expect(migrateFrom420r2To420r3Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        collideWith: ["walls", "actors"],
        moveType: "horizontal",
        units: "tiles",
      },
    });
  });
  test("should migrate EVENT_ACTOR_MOVE_TO event with false collisions to empty collideWith", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        useCollisions: false,
        moveType: "horizontal",
        units: "tiles",
      },
    };
    expect(migrateFrom420r2To420r3Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        collideWith: [],
        moveType: "horizontal",
        units: "tiles",
      },
    });
  });
  test("should migrate EVENT_ACTOR_MOVE_TO event with missing collisions to empty collideWith", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        moveType: "horizontal",
        units: "tiles",
      },
    };
    expect(migrateFrom420r2To420r3Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        collideWith: [],
        moveType: "horizontal",
        units: "tiles",
      },
    });
  });
  test("should migrate EVENT_ACTOR_MOVE_RELATIVE event", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_MOVE_RELATIVE",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        useCollisions: true,
        moveType: "horizontal",
        units: "tiles",
      },
    };
    expect(migrateFrom420r2To420r3Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_MOVE_RELATIVE",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        collideWith: ["walls", "actors"],
        moveType: "horizontal",
        units: "tiles",
      },
    });
  });
});

describe("migrateFrom420r2To420r3EngineFields", () => {
  const getFieldValue = (
    values: { engineFieldValues: EngineFieldValue[] },
    id: string,
  ) => {
    return (
      values.engineFieldValues.find(
        (field: EngineFieldValue) => field.id === id,
      )?.value || null
    );
  };

  test("should double the shooter_scroll_speed value", () => {
    const resources: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      engineFieldValues: {
        ...dummyCompressedProjectResources.engineFieldValues,
        engineFieldValues: [
          { id: "shooter_scroll_speed", value: 5 },
          { id: "other_field", value: 10 },
        ],
      },
    };
    const migrated = migrateFrom420r2To420r3EngineFields(resources);
    expect(
      getFieldValue(migrated.engineFieldValues, "shooter_scroll_speed"),
    ).toEqual(10);
  });

  test("should not modify other engine fields", () => {
    const resources: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      engineFieldValues: {
        ...dummyCompressedProjectResources.engineFieldValues,
        engineFieldValues: [{ id: "other_field", value: 10 }],
      },
    };
    const migrated = migrateFrom420r2To420r3EngineFields(resources);
    expect(getFieldValue(migrated.engineFieldValues, "other_field")).toEqual(
      10,
    );
  });

  test("should set new enabled flag defaults to false matching previous default behaviour", () => {
    const resources: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      engineFieldValues: {
        ...dummyCompressedProjectResources.engineFieldValues,
        engineFieldValues: [],
      },
    };
    const migrated = migrateFrom420r2To420r3EngineFields(resources);
    expect(migrated.engineFieldValues.engineFieldValues).toEqual([
      {
        id: "FEAT_PLATFORM_COYOTE_TIME",
        value: 0,
      },
      {
        id: "FEAT_PLATFORM_DROP_THROUGH",
        value: 0,
      }
    ]);
  });

  test("should not set flag defaults to false when value is already set", () => {
    const resources: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      engineFieldValues: {
        ...dummyCompressedProjectResources.engineFieldValues,
        engineFieldValues: [
          {
            id: "FEAT_PLATFORM_COYOTE_TIME",
            value: 1,
          },
        ],
      },
    };
    const migrated = migrateFrom420r2To420r3EngineFields(resources);
    expect(migrated.engineFieldValues.engineFieldValues).toEqual([
      {
        id: "FEAT_PLATFORM_COYOTE_TIME",
        value: 1,
      },
      {
        id: "FEAT_PLATFORM_DROP_THROUGH",
        value: 0,
      }
    ]);
  });
});
