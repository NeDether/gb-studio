import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import l10n from "shared/lib/lang/l10n";
import { SceneParallaxLayer } from "shared/lib/entities/entitiesTypes";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { FormField } from "ui/form/layout/FormLayout";
import { Select } from "ui/form/Select";
import { ParallaxSpeedSelect } from "./ParallaxSpeedSelect";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch } from "store/hooks";
import { SingleValue } from "react-select";

interface ParallaxOption {
  value: number;
  label: string;
}

interface ParallaxSelectProps {
  name: string;
  sceneHeight: number;
  value?: SceneParallaxLayer[];
  onChange?: (newId: SceneParallaxLayer[] | undefined) => void;
}

const LayersWrapper = styled.div`
  background: ${(props) => props.theme.colors.sidebar.well.background};
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
  margin-left: -10px;
  margin-right: -10px;
  margin-top: 10px;
  margin-bottom: -10px;
  padding-bottom: 0;
  box-shadow: ${(props) => props.theme.colors.sidebar.well.boxShadow};
`;

const LayerWrapper = styled.div`
  & ~ div {
    margin-top: 0px;
  }
`;

const LayerIndex = styled.div`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: ${(props) => props.theme.colors.sidebar.well.hoverBackground};
  font-weight: bold;
  border-radius: 4px;
  text-align: center;
  line-height: 28px;
`;

const LayerRow = styled.div`
  display: flex;
  padding: 0 10px;
  padding-top: 10px;
  margin-bottom: -5px;

  & > * {
    margin-right: 10px;
    margin-bottom: 10px;
  }

  & > *:last-child {
    margin-right: 0px;
  }

  &:hover {
    background: ${(props) => props.theme.colors.sidebar.well.hoverBackground};
    ${LayerIndex} {
      background: ${(props) => props.theme.colors.sidebar.well.background};
    }
  }
`;

export const defaultValues: SceneParallaxLayer[] = [
  {
    height: 3,
    speed: 2,
  },
  {
    height: 3,
    speed: 1,
  },
  {
    height: 0,
    speed: 0,
  },
];

const MAX_PARALLAX_HEIGHT = 17;

const sliceLayers = (
  value: SceneParallaxLayer[] | undefined,
  length: number,
) => {
  const slicedDefaults = defaultValues.slice(-length);
  if (!value) {
    return slicedDefaults;
  }
  const heightDiff = slicedDefaults.length - value.length;
  let heightTotal = 0;
  return slicedDefaults.map((layer, layerIndex) => {
    const prev = value[layerIndex - heightDiff];
    let newLayer = layer;
    if (prev) {
      newLayer = prev;
    }
    // Make sure total height isn't > MAX_PARALLAX_HEIGHT
    if (heightTotal + newLayer.height > MAX_PARALLAX_HEIGHT) {
      newLayer = {
        ...newLayer,
        height: Math.max(1, MAX_PARALLAX_HEIGHT - heightTotal),
      };
    }
    heightTotal += newLayer.height;
    return newLayer;
  });
};

const updateParallaxHeight = (
  value: SceneParallaxLayer[],
  layerIndex: number,
  height: number,
) => {
  const maxHeight = MAX_PARALLAX_HEIGHT;
  const maxLayerHeight = maxHeight - Math.max(0, value.length - 2);

  const newValue = value.map((v, i) => {
    if (i === layerIndex) {
      return {
        ...v,
        height: Math.min(maxLayerHeight, height),
      };
    }
    return v;
  });

  // Calculate new total height
  const layersHeight = newValue.reduce((memo, layer, layerIndex) => {
    if (layerIndex < newValue.length - 1) {
      return memo + layer.height;
    }
    return memo;
  }, 0);

  // If total is over limit reduce height of other layers
  let heightOverflow = layersHeight - maxHeight;
  if (heightOverflow > 0) {
    return newValue.map((v, i) => {
      if (i === layerIndex) {
        return v;
      }
      const newHeight = Math.max(1, v.height - heightOverflow);
      heightOverflow -= v.height - newHeight;
      return {
        ...v,
        height: i === value.length - 1 ? 0 : newHeight,
      };
    });
  }

  return newValue;
};

const updateParallaxSpeed = (
  value: SceneParallaxLayer[],
  layerIndex: number,
  speed: number,
) => {
  return value.map((v, i) => {
    if (i === layerIndex) {
      return {
        ...v,
        speed,
      };
    }
    return v;
  });
};

const ParallaxSelect = ({
  name,
  value,
  sceneHeight,
  onChange,
}: ParallaxSelectProps) => {
  const dispatch = useAppDispatch();

  const options: ParallaxOption[] = useMemo(
    () => [
      { value: 0, label: `${l10n("FIELD_PARALLAX_NONE")}` },
      { value: 1, label: `1 ${l10n("FIELD_LAYER")}` },
      { value: 2, label: `2 ${l10n("FIELD_LAYERS")}` },
      { value: 3, label: `3 ${l10n("FIELD_LAYERS")}` },
    ],
    [],
  );

  const [selectValue, setSelectValue] = useState<ParallaxOption>(options[0]);

  useEffect(() => {
    if (!value) {
      setSelectValue(options[0]);
    } else {
      const selectValue =
        options.find((o) => o.value === value.length) || options[0];
      setSelectValue(selectValue);
    }
  }, [options, value]);

  const setHoverLayer = useCallback(
    (layer: number | undefined) => {
      dispatch(editorActions.setParallaxHoverLayer(layer));
    },
    [dispatch],
  );

  const lastLayerHeight = value?.reduce((memo, value) => {
    return memo - value.height;
  }, sceneHeight);

  return (
    <div>
      <Select
        name={name}
        value={selectValue}
        options={options}
        onChange={(newValue: SingleValue<ParallaxOption>) => {
          if (newValue) {
            if (newValue.value > 0) {
              onChange?.(sliceLayers(value, newValue.value));
            } else {
              onChange?.(undefined);
              setHoverLayer(undefined);
            }
          }
        }}
      />
      {value && (
        <LayersWrapper onMouseLeave={() => setHoverLayer(undefined)}>
          {value.map((layer, layerIndex) => (
            <LayerWrapper key={layerIndex}>
              <LayerRow onMouseOver={() => setHoverLayer(layerIndex)}>
                <LayerIndex>{layerIndex + 1}</LayerIndex>
                <CoordinateInput
                  name={`layer_${layerIndex}_height`}
                  coordinate="h"
                  min={1}
                  value={
                    layerIndex === value.length - 1
                      ? lastLayerHeight
                      : layer.height || undefined
                  }
                  placeholder="1"
                  disabled={layerIndex === value.length - 1}
                  onChange={(e) => {
                    const height = Number(e.currentTarget.value);
                    onChange?.(updateParallaxHeight(value, layerIndex, height));
                  }}
                />
                <FormField name={`layer_${layerIndex}_speed`}>
                  {layerIndex === 2 && value.length === 3 ? (
                    <ParallaxSpeedSelect
                      name={`layer_${layerIndex}_speed`}
                      value={0}
                      disabled
                    />
                  ) : (
                    <ParallaxSpeedSelect
                      name={`layer_${layerIndex}_speed`}
                      value={layer.speed}
                      onChange={(speed) => {
                        onChange?.(
                          updateParallaxSpeed(value, layerIndex, speed),
                        );
                      }}
                    />
                  )}
                </FormField>
              </LayerRow>
            </LayerWrapper>
          ))}
        </LayersWrapper>
      )}
    </div>
  );
};

export default ParallaxSelect;
