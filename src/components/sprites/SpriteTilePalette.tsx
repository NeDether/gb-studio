import React, { useCallback, useEffect, useRef, useState } from "react";
import { SpriteTileSelection } from "store/features/editor/editorState";
import { spriteSheetSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { roundDown8 } from "shared/lib/helpers/8bit";
import styled from "styled-components";
import l10n from "shared/lib/lang/l10n";
import electronActions from "store/features/electron/electronActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { assetPath, assetURL } from "shared/lib/helpers/assets";
import MetaspriteGrid, {
  generateGridBackground,
} from "components/sprites/MetaspriteGrid";

const PillWrapper = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  bottom: 10px;
  left: 10px;
  z-index: 11;
  border-radius: 16px;
  background: ${(props) => props.theme.colors.background};
  box-shadow: 0 0 0 2px ${(props) => props.theme.colors.background};
  font-size: ${(props) => props.theme.typography.fontSize};
`;

const Pill = styled.button`
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 16px;
  padding: 3px 10px;
  font-size: ${(props) => props.theme.typography.fontSize};

  &:active {
    background: ${(props) => props.theme.colors.list.selectedBackground};
  }
`;

interface SpriteTilePaletteProps {
  id: string;
  precisionMode: boolean;
}

interface Coordinates {
  x: number;
  y: number;
}

const SpriteTilePalette = ({ id, precisionMode }: SpriteTilePaletteProps) => {
  const dispatch = useAppDispatch();
  const zoom = useAppSelector((state) => state.editor.zoomSpriteTiles) / 100;
  const selectedTiles = useAppSelector(
    (state) => state.editor.spriteTileSelection,
  );

  const setSelectedTiles = useCallback(
    (tiles: SpriteTileSelection) => {
      dispatch(editorActions.setSpriteTileSelection(tiles));
    },
    [dispatch],
  );
  const [hoverTile, setHoverTile] = useState<Coordinates | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const spriteSheet = useAppSelector((state) =>
    spriteSheetSelectors.selectById(state, id),
  );
  const selectedTileIds = useAppSelector(
    (state) => state.editor.selectedMetaspriteTileIds,
  );
  const replaceSpriteTileMode = useAppSelector(
    (state) => state.editor.replaceSpriteTileMode,
  );
  const defaultSpriteMode = useAppSelector(
    (state) => state.project.present.settings.spriteMode,
  );
  const width = spriteSheet?.width || 0;
  const height = spriteSheet?.height || 0;
  const spriteMode = spriteSheet?.spriteMode ?? defaultSpriteMode;

  const snapX = useCallback(
    (offsetX: number): number => {
      return Math.min(
        width - 8,
        Math.max(0, precisionMode ? offsetX - 4 : roundDown8(offsetX)),
      );
    },
    [precisionMode, width],
  );

  const snapY = useCallback(
    (offsetY: number): number => {
      return Math.min(
        height - (spriteMode === "8x8" ? 8 : 16),
        Math.max(0, precisionMode ? offsetY - 8 : roundDown8(offsetY)),
      );
    },
    [height, spriteMode, precisionMode],
  );

  const onReplace = useCallback(
    (sliceX: number, sliceY: number) => {
      dispatch(
        entitiesActions.editMetaspriteTile({
          spriteSheetId: id,
          metaspriteTileId: selectedTileIds[0],
          changes: {
            sliceX,
            sliceY,
          },
        }),
      );
      dispatch(editorActions.setReplaceSpriteTileMode(false));
    },
    [dispatch, id, selectedTileIds],
  );

  const onDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();

      const currentTargetRect = e.currentTarget.getBoundingClientRect();

      const offsetX = Math.floor((e.pageX - currentTargetRect.left) / zoom);
      const offsetY = Math.floor((e.pageY - currentTargetRect.top) / zoom);

      if (replaceSpriteTileMode && selectedTileIds[0]) {
        onReplace(snapX(offsetX), snapY(offsetY));
        return;
      }

      setSelectedTiles({
        x: snapX(offsetX),
        y: snapY(offsetY),
        width: 1,
        height: 1,
      });
      setIsDragging(true);
    },
    [
      onReplace,
      replaceSpriteTileMode,
      selectedTileIds,
      setSelectedTiles,
      snapX,
      snapY,
      zoom,
    ],
  );

  const onDrag = useCallback(
    (e: MouseEvent) => {
      if (!wrapperRef.current || !selectedTiles) {
        return;
      }
      const currentTargetRect = wrapperRef.current.getBoundingClientRect();

      const offsetX = Math.floor((e.pageX - currentTargetRect.left) / zoom);
      const offsetY = Math.floor((e.pageY - currentTargetRect.top) / zoom);

      const x = Math.min(selectedTiles.x, offsetX);
      const y = Math.min(selectedTiles.y, offsetY);

      const selectionWidth = Math.ceil(
        Math.max(
          8,
          offsetX < selectedTiles.x ? 1 : offsetX - selectedTiles.x + 1,
        ) / 8,
      );
      const selectionHeight = Math.ceil(
        Math.max(
          8,
          offsetY < selectedTiles.y ? 2 : offsetY - selectedTiles.y + 1,
        ) / (spriteMode === "8x8" ? 8 : 16),
      );

      setSelectedTiles({
        x: snapX(precisionMode ? offsetX : x),
        y: snapY(precisionMode ? offsetY : y),
        width: precisionMode ? 1 : selectionWidth,
        height: precisionMode ? 1 : selectionHeight,
      });
    },
    [
      selectedTiles,
      zoom,
      spriteMode,
      setSelectedTiles,
      snapX,
      precisionMode,
      snapY,
    ],
  );

  const onDragEnd = (_e: MouseEvent) => {
    setIsDragging(false);
    setHoverTile(undefined);
  };

  const onHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const currentTargetRect = e.currentTarget.getBoundingClientRect();
      const offsetX = Math.floor((e.pageX - currentTargetRect.left) / zoom);
      const offsetY = Math.floor((e.pageY - currentTargetRect.top) / zoom);
      setHoverTile({
        x: snapX(offsetX),
        y: snapY(offsetY),
      });
    },
    [zoom, snapX, snapY],
  );

  const onMouseOut = useCallback(() => {
    setHoverTile(undefined);
  }, []);

  // Drag and drop handlers
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onDragEnd);
      return () => {
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onDragEnd);
      };
    }
    return () => {};
  }, [isDragging, onDrag]);

  const onEdit = useCallback(() => {
    if (spriteSheet) {
      dispatch(
        electronActions.openFile({
          filename: assetPath("sprites", spriteSheet),
          type: "image",
        }),
      );
    }
  }, [spriteSheet, dispatch]);

  if (!spriteSheet) {
    return null;
  }

  const spriteURL = assetURL("sprites", spriteSheet);

  return (
    <div
      style={{
        position: "absolute",
        top: 32,
        left: 0,
        right: 0,
        bottom: 0,
        overflowX: "auto",
        overflowY: "scroll",
        minWidth: 0,
      }}
    >
      <PillWrapper>
        <Pill onClick={onEdit}>{l10n("FIELD_EDIT_IMAGE")}</Pill>
      </PillWrapper>

      <div
        style={{
          display: "flex",
          width: "100%",
          minHeight: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            textAlign: "center",
            padding: 10,
          }}
        >
          <div
            ref={wrapperRef}
            style={{
              position: "relative",
              userSelect: "none",
              display: "inline-block",
            }}
            onMouseDown={onDragStart}
            onMouseMove={onHover}
            onMouseLeave={onMouseOut}
          >
            <img
              style={{
                imageRendering: "pixelated",
                minWidth: width * zoom,
              }}
              alt={spriteSheet.name}
              src={spriteURL}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: width * zoom,
                height: height * zoom,
                border: `${1 / zoom}px solid #d4d4d4`,
                backgroundSize: `${8 * zoom}px ${8 * zoom}px`,
                backgroundImage: generateGridBackground(
                  zoom,
                  "#32cb46",
                  "#079f1c",
                ),
              }}
            />
            {hoverTile && !isDragging && (
              <div
                style={{
                  position: "absolute",
                  left: hoverTile.x * zoom,
                  top: hoverTile.y * zoom,
                  width: 8 * zoom,
                  height: (spriteMode === "8x8" ? 8 : 16) * zoom,
                  background: "rgba(0,0,0,0.1)",
                }}
              />
            )}
            {selectedTiles && (
              <div
                style={{
                  position: "absolute",
                  left: selectedTiles.x * zoom,
                  top: selectedTiles.y * zoom,
                  width: selectedTiles.width * 8 * zoom,
                  height:
                    selectedTiles.height *
                    (spriteMode === "8x8" ? 8 : 16) *
                    zoom,
                  boxShadow: `0px 0px 0px ${zoom}px rgba(255, 0, 0, 0.5)`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpriteTilePalette;
