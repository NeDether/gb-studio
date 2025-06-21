import React, { memo, useCallback, useEffect, useState } from "react";
import editorActions from "store/features/editor/editorActions";
import { triggerSelectors } from "store/features/entities/entitiesState";
import { MIDDLE_MOUSE, TILE_SIZE } from "consts";
import styled, { css } from "styled-components";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ContextMenu } from "ui/menu/ContextMenu";
import renderTriggerContextMenu from "./renderTriggerContextMenu";

interface TriggerViewProps {
  id: string;
  sceneId: string;
  editable?: boolean;
}

interface WrapperProps {
  $selected?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: rgba(255, 120, 0, 0.5);
  outline: 1px solid rgba(255, 120, 0, 1);
  -webkit-transform: translate3d(0, 0, 0);

  ${(props) =>
    props.$selected
      ? css`
          background-color: rgba(255, 199, 40, 0.9);
        `
      : ""}
`;

const TriggerView = memo(({ id, sceneId, editable }: TriggerViewProps) => {
  const dispatch = useAppDispatch();
  const trigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, id),
  );
  const selected = useAppSelector(
    (state) =>
      state.editor.type === "trigger" &&
      state.editor.scene === sceneId &&
      state.editor.entityId === id,
  );
  const isDragging = useAppSelector(
    (state) => selected && state.editor.dragging,
  );

  const onMouseUp = useCallback(() => {
    dispatch(editorActions.dragTriggerStop());
    window.removeEventListener("mouseup", onMouseUp);
  }, [dispatch]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (editable && e.nativeEvent.which !== MIDDLE_MOUSE) {
        dispatch(editorActions.dragTriggerStart({ sceneId, triggerId: id }));
        dispatch(editorActions.setTool({ tool: "select" }));
        window.addEventListener("mouseup", onMouseUp);
      }
    },
    [dispatch, editable, id, onMouseUp, sceneId],
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseUp, isDragging]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    menu: JSX.Element[];
  }>();

  const renderContextMenu = useCallback(() => {
    return renderTriggerContextMenu({
      dispatch,
      triggerId: id,
      sceneId,
    });
  }, [dispatch, id, sceneId]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      const menu = renderContextMenu();
      if (!menu) {
        return;
      }
      setContextMenu({ x: e.pageX, y: e.pageY, menu });
    },
    [renderContextMenu],
  );

  const onContextMenuClose = useCallback(() => {
    setContextMenu(undefined);
  }, []);

  if (!trigger) {
    return <></>;
  }

  return (
    <Wrapper
      $selected={selected}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      style={{
        left: trigger.x * TILE_SIZE,
        top: trigger.y * TILE_SIZE,
        width: Math.max(trigger.width, 1) * TILE_SIZE,
        height: Math.max(trigger.height, 1) * TILE_SIZE,
      }}
    >
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={onContextMenuClose}
        >
          {contextMenu.menu}
        </ContextMenu>
      )}
    </Wrapper>
  );
});

export default TriggerView;
