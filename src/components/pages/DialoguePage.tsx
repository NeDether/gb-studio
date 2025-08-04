import React, { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";
import DialogueReviewScene from "components/script/DialogueReviewScene";
import {
  actorPrefabSelectors,
  actorSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerPrefabSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import {
  actorName,
  sceneName,
  triggerName,
} from "shared/lib/entities/entitiesHelpers";
import { EVENT_TEXT } from "consts";
import { DialogueLine } from "components/script/DialogueReviewLine";
import styled from "styled-components";
import { PageHeader } from "ui/layout/PageHeader";
import {
  walkNormalizedActorScripts,
  walkNormalizedSceneSpecificScripts,
  walkNormalizedTriggerScripts,
} from "shared/lib/scripts/walk";

const Wrapper = styled.div`
  background: ${(props) => props.theme.colors.background};
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  overflow: auto;
  padding-bottom: 40px;
`;

const Content = styled.div`
  width: 100%;
  max-width: 1000px;
  padding-top: 20px;
`;

const DialoguePage = () => {
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state),
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state),
  );
  const actorPrefabsLookup = useAppSelector(
    actorPrefabSelectors.selectEntities,
  );
  const triggerPrefabsLookup = useAppSelector(
    triggerPrefabSelectors.selectEntities,
  );
  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state),
  );

  const [openScenes, setOpenScenes] = useState<string[]>([]);

  const onToggleScene = (sceneId: string) => () => {
    if (openScenes.includes(sceneId)) {
      setOpenScenes(openScenes.filter((id) => id !== sceneId));
    } else {
      setOpenScenes(([] as string[]).concat(openScenes, sceneId));
    }
  };

  const sortedScenes = scenes
    .map((scene, sceneIndex) => ({
      id: scene.id,
      name: sceneName(scene, sceneIndex),
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

  const dialogueLines = useMemo(
    () =>
      scenes.reduce((memo, scene, sceneIndex) => {
        scene.actors.forEach((actorId, actorIndex) => {
          const actor = actorsLookup[actorId];
          actor &&
            walkNormalizedActorScripts(
              actor,
              scriptEventsLookup,
              actorPrefabsLookup,
              undefined,
              (cmd) => {
                if (cmd.command === EVENT_TEXT) {
                  memo.push({
                    entityName: actorName(actor, actorIndex),
                    sceneName: sceneName(scene, sceneIndex),
                    line: cmd,
                  });
                }
              },
            );
        });
        scene.triggers.forEach((triggerId, triggerIndex) => {
          const trigger = triggersLookup[triggerId];
          trigger &&
            walkNormalizedTriggerScripts(
              trigger,
              scriptEventsLookup,
              triggerPrefabsLookup,
              undefined,
              (cmd) => {
                if (cmd.command === EVENT_TEXT) {
                  memo.push({
                    entityName: triggerName(trigger, triggerIndex),
                    sceneName: sceneName(scene, sceneIndex),
                    line: cmd,
                  });
                }
              },
            );
        });
        walkNormalizedSceneSpecificScripts(
          scene,
          scriptEventsLookup,
          undefined,
          (cmd) => {
            if (cmd.command === EVENT_TEXT) {
              memo.push({
                entityName: sceneName(scene, sceneIndex),
                sceneName: sceneName(scene, sceneIndex),
                line: cmd,
              });
            }
          },
        );
        return memo;
      }, [] as DialogueLine[]),
    [
      actorPrefabsLookup,
      actorsLookup,
      scenes,
      scriptEventsLookup,
      triggerPrefabsLookup,
      triggersLookup,
    ],
  );

  const scriptWords = dialogueLines.reduce((memo, dialogueLine) => {
    if (
      dialogueLine &&
      dialogueLine.line &&
      dialogueLine.line.args &&
      dialogueLine.line.args.text
    ) {
      if (Array.isArray(dialogueLine.line.args.text)) {
        return (
          memo +
          dialogueLine.line.args.text.reduce((eventMemo, text) => {
            if (typeof text === "string") {
              const words = text.trim().split(/[, \n]+/);
              if (words) {
                return eventMemo + words.length;
              }
            }
            return eventMemo;
          }, 0)
        );
      }
      if (typeof dialogueLine.line.args.text === "string") {
        const words = dialogueLine.line.args.text.trim().split(/[, \n]+/);
        if (words) {
          return memo + words.length;
        }
        return memo;
      }
    }
    return memo;
  }, 0);

  return (
    <Wrapper>
      <PageHeader>
        <h1>{l10n("DIALOGUE_REVIEW")}</h1>
        <p>
          {dialogueLines.length}{" "}
          {dialogueLines.length === 1
            ? l10n("DIALOGUE_LINE")
            : l10n("DIALOGUE_LINES")}
        </p>
        <p>
          {scriptWords}{" "}
          {scriptWords === 1 ? l10n("DIALOGUE_WORD") : l10n("DIALOGUE_WORDS")}
        </p>
      </PageHeader>
      <Content>
        {sortedScenes.map((scene) => (
          <DialogueReviewScene
            id={scene.id}
            key={scene.id}
            open={openScenes.includes(scene.id)}
            onToggle={onToggleScene(scene.id)}
          />
        ))}
      </Content>
    </Wrapper>
  );
};

export default DialoguePage;
