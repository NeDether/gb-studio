import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  actorSelectors,
  sceneSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { EntityListItem } from "ui/lists/EntityListItem";
import useToggleableList from "ui/hooks/use-toggleable-list";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import {
  SceneNavigatorItem,
  buildSceneNavigatorItems,
  sceneParentFolders,
  scenesInFolder,
} from "shared/lib/entities/buildSceneNavigatorItems";
import renderSceneContextMenu from "./renderSceneContextMenu";
import renderActorContextMenu from "./renderActorContextMenu";
import renderTriggerContextMenu from "./renderTriggerContextMenu";
import { assertUnreachable } from "shared/lib/helpers/assert";
import renderSceneFolderContextMenu from "components/world/renderSceneFolderContextMenu";

interface NavigatorScenesProps {
  height: number;
  searchTerm: string;
}

const StartSceneLabel = styled.div`
  font-weight: bold;
`;

export const NavigatorScenes: FC<NavigatorScenesProps> = ({
  height,
  searchTerm,
}) => {
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state),
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state),
  );
  const sceneId = useAppSelector((state) => state.editor.scene);
  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const startSceneId = useAppSelector(
    (state) => state.project.present.settings.startSceneId,
  );
  const startDirection = useAppSelector(
    (state) => state.project.present.settings.startDirection,
  );
  const sceneSelectionIds = useAppSelector(
    (state) => state.editor.sceneSelectionIds,
  );
  const runSceneSelectionOnly = useAppSelector(
    (state) => state.project.present.settings.runSceneSelectionOnly,
  );
  const colorsEnabled = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono",
  );
  const [folderId, setFolderId] = useState("");

  const dispatch = useAppDispatch();

  const addToSelection = useRef(false);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.shiftKey) {
      addToSelection.current = true;
    }
  }, []);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (!e.shiftKey) {
      addToSelection.current = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  const {
    values: manuallyOpenedFolders,
    toggle: toggleFolderOpen,
    set: openFolder,
    unset: closeFolder,
  } = useToggleableList<string>([]);

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId),
  );

  const openFolders = useMemo(() => {
    return [
      ...manuallyOpenedFolders,
      ...(scene ? sceneParentFolders(scene) : []),
    ];
  }, [manuallyOpenedFolders, scene]);

  const nestedSceneItems = useMemo(
    () =>
      buildSceneNavigatorItems(
        scenes,
        actorsLookup,
        triggersLookup,
        openFolders,
        searchTerm,
      ),
    [scenes, actorsLookup, triggersLookup, openFolders, searchTerm],
  );

  useEffect(() => {
    if (sceneId || entityId) {
      setFolderId("");
    }
  }, [entityId, sceneId]);

  const selectedId =
    folderId ||
    (editorType === "scene" || !openFolders.includes(sceneId)
      ? sceneId
      : entityId);

  const clearFolderSelection = useCallback(() => {
    setFolderId("");
  }, []);

  const setSelectedId = (id: string, item: SceneNavigatorItem) => {
    if (item.type === "actor") {
      dispatch(
        editorActions.selectActor({ actorId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
      clearFolderSelection();
    } else if (item.type === "trigger") {
      dispatch(
        editorActions.selectTrigger({ triggerId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
      clearFolderSelection();
    } else if (item.type === "scene") {
      if (addToSelection.current) {
        dispatch(editorActions.toggleSceneSelectedId(id));
      } else {
        dispatch(editorActions.selectScene({ sceneId: id }));
      }
      dispatch(editorActions.setFocusSceneId(item.id));
      clearFolderSelection();
    } else {
      setFolderId(id);
    }
  };

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId],
  );

  const onRenameSceneComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editScene({
            sceneId: renameId,
            changes: {
              name,
            },
          }),
        );
      }
      setRenameId("");
    },
    [dispatch, renameId],
  );

  const onRenameActorComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editActor({
            actorId: renameId,
            changes: {
              name,
            },
          }),
        );
      }
      setRenameId("");
    },
    [dispatch, renameId],
  );

  const onRenameTriggerComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editTrigger({
            triggerId: renameId,
            changes: {
              name,
            },
          }),
        );
      }
      setRenameId("");
    },
    [dispatch, renameId],
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const renderContextMenu = useCallback(
    (item: SceneNavigatorItem, onClose: () => void) => {
      if (item.type === "scene") {
        return renderSceneContextMenu({
          dispatch,
          sceneId: item.id,
          additionalSceneIds: sceneSelectionIds,
          startSceneId,
          startDirection,
          hoverX: 0,
          hoverY: 0,
          colorsEnabled,
          colorModeOverride: item.scene.colorModeOverride,
          onRename: () => setRenameId(item.id),
          runSceneSelectionOnly,
          onClose,
        });
      } else if (item.type === "actor") {
        return renderActorContextMenu({
          dispatch,
          sceneId: item.sceneId,
          actorId: item.id,
          onRename: () => setRenameId(item.id),
        });
      } else if (item.type === "trigger") {
        return renderTriggerContextMenu({
          dispatch,
          sceneId: item.sceneId,
          triggerId: item.id,
          onRename: () => setRenameId(item.id),
        });
      } else if (item.type === "folder") {
        return renderSceneFolderContextMenu({
          dispatch,
          scenes: scenesInFolder(item.id, scenes),
        });
      } else {
        assertUnreachable(item);
      }
    },
    [
      dispatch,
      runSceneSelectionOnly,
      sceneSelectionIds,
      scenes,
      startDirection,
      startSceneId,
      colorsEnabled,
    ],
  );

  const renderLabel = useCallback(
    (item: SceneNavigatorItem) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }
      if (item.id === startSceneId) {
        return <StartSceneLabel>{item.filename}</StartSceneLabel>;
      }
      return item.filename;
    },
    [startSceneId, toggleFolderOpen],
  );

  return (
    <FlatList
      selectedId={selectedId}
      highlightIds={folderId ? [] : sceneSelectionIds}
      items={nestedSceneItems}
      setSelectedId={setSelectedId}
      height={height}
      onKeyDown={(e: KeyboardEvent) => {
        listenForRenameStart(e);
        if (e.key === "ArrowRight") {
          openFolder(selectedId);
        } else if (e.key === "ArrowLeft") {
          closeFolder(selectedId);
        }
      }}
      children={({ item }) =>
        item.type === "scene" || item.type === "folder" ? (
          <EntityListItem
            item={item}
            type={item.type === "folder" ? "folder" : "scene"}
            rename={item.type !== "folder" && renameId === item.id}
            onRename={onRenameSceneComplete}
            onRenameCancel={onRenameCancel}
            renderContextMenu={renderContextMenu}
            collapsable={item.type === "folder" || item.type === "scene"}
            collapsed={!openFolders.includes(item.id)}
            onToggleCollapse={() => toggleFolderOpen(item.id)}
            nestLevel={item.nestLevel}
            renderLabel={renderLabel}
          />
        ) : (
          <EntityListItem
            item={item}
            type={item.type}
            nestLevel={item.nestLevel}
            rename={renameId === item.id}
            onRename={
              item.type === "actor"
                ? onRenameActorComplete
                : onRenameTriggerComplete
            }
            onRenameCancel={onRenameCancel}
            renderContextMenu={renderContextMenu}
          />
        )
      }
    />
  );
};
