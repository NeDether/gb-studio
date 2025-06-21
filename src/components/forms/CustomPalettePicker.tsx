import React, { useCallback, useEffect, useRef, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import ColorSlider from "./ColorSlider";
import { paletteSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { Button } from "ui/buttons/Button";
import { hexDec } from "shared/lib/helpers/8bit";
import clamp from "shared/lib/helpers/clamp";
import styled, { css } from "styled-components";
import { TextField } from "ui/form/TextField";
import { NumberField } from "ui/form/NumberField";
import { FixedSpacer } from "ui/spacing/Spacing";
import API from "renderer/lib/api";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { GBCHexToColorCorrectedHex } from "shared/lib/color/colorCorrection";
import { hex2GBChex, rgb5BitToGBCHex } from "shared/lib/helpers/color";
import { getSettings } from "store/features/settings/settingsState";

const DEFAULT_WHITE = "E8F8E0";
const DEFAULT_LIGHT = "B0F088";
const DEFAULT_DARK = "509878";
const DEFAULT_BLACK = "202850";

type ColorIndex = 0 | 1 | 2 | 3;

const defaultColors = [
  DEFAULT_WHITE,
  DEFAULT_LIGHT,
  DEFAULT_DARK,
  DEFAULT_BLACK,
];

interface CustomPalettePickerProps {
  paletteId: string;
}

const colorIndexes: ColorIndex[] = [0, 1, 2, 3];

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1000px;
`;

const ColorsWrapper = styled.div`
  display: grid;
  grid-template-columns: auto auto auto auto;
  gap: 10px;
  margin-bottom: 20px;
`;

const ColorValueForm = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 20px;
  margin-bottom: 20px;
`;

const ColorValueFormItem = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;

  > *:first-child {
    margin-bottom: 5px;
  }
`;

interface ColorButtonProps {
  $selected?: boolean;
}

const ColorButton = styled.button<ColorButtonProps>`
  position: relative;
  display: flex;
  justify-content: center;
  text-align: center;
  border: 1px solid ${(props) => props.theme.colors.input.border};
  border-radius: ${(props) => props.theme.borderRadius}px;
  max-height: 128px;
  height: 10vh;
  width: 100%;

  span {
    position: absolute;
    top: -25px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: ${(props) => props.theme.colors.text};
  }

  &:hover {
    box-shadow: 0 0 0px 4px ${(props) => props.theme.colors.input.border};
  }

  ${(props) =>
    props.$selected
      ? css`
          &,
          &:hover {
            box-shadow: 0 0 0px 4px ${(props) => props.theme.colors.highlight};
          }
        `
      : ""}
`;

const hexToDecimal = hexDec;

const clamp31 = (value: number) => {
  return clamp(value, 0, 31);
};

const decimalToHexString = (number: number) => {
  const ret = number.toString(16).toUpperCase();
  return ret.length === 1 ? `0${ret}` : ret;
};

const HSVtoRGB = (h: number, s: number, v: number) => {
  let r = 0;
  let g = 0;
  let b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: {
      r = v;
      g = t;
      b = p;
      break;
    }
    case 1: {
      r = q;
      g = v;
      b = p;
      break;
    }
    case 2: {
      r = p;
      g = v;
      b = t;
      break;
    }
    case 3: {
      r = p;
      g = q;
      b = v;
      break;
    }
    case 4: {
      r = t;
      g = p;
      b = v;
      break;
    }
    case 5: {
      r = v;
      g = p;
      b = q;
      break;
    }
    default:
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

const RGBtoHSV = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;

  switch (max) {
    case min:
      h = 0;
      break;
    case r:
      h = g - b + d * (g < b ? 6 : 0);
      h /= 6 * d;
      break;
    case g:
      h = b - r + d * 2;
      h /= 6 * d;
      break;
    case b:
      h = r - g + d * 4;
      h /= 6 * d;
      break;
    default:
  }

  return {
    h,
    s,
    v,
  };
};

const CustomPalettePicker = ({ paletteId }: CustomPalettePickerProps) => {
  const dispatch = useAppDispatch();

  const prevPaletteIdRef = useRef<string>();

  const palette = useAppSelector((state) =>
    paletteSelectors.selectById(state, paletteId),
  );

  const colorCorrection = useAppSelector(
    (state) => getSettings(state).colorCorrection,
  );

  const [selectedColor, setSelectedColor] = useState<ColorIndex>(0);
  const [colorR, setColorR] = useState(0);
  const [colorG, setColorG] = useState(0);
  const [colorB, setColorB] = useState(0);
  const [colorH, setColorH] = useState(0);
  const [colorS, setColorS] = useState(0);
  const [colorV, setColorV] = useState(0);
  const [currentCustomHex, setCurrentCustomHex] = useState("");

  const getWhiteHex = useCallback(
    () => palette?.colors[0] || DEFAULT_WHITE,
    [palette?.colors],
  );
  const getLightHex = useCallback(
    () => palette?.colors[1] || DEFAULT_LIGHT,
    [palette?.colors],
  );
  const getDarkHex = useCallback(
    () => palette?.colors[2] || DEFAULT_DARK,
    [palette?.colors],
  );
  const getBlackHex = useCallback(
    () => palette?.colors[3] || DEFAULT_BLACK,
    [palette?.colors],
  );

  const updateCurrentColor = useCallback(
    (newHex: string) => {
      if (selectedColor === 0) {
        dispatch(
          entitiesActions.editPalette({
            paletteId,
            changes: {
              colors: [newHex, getLightHex(), getDarkHex(), getBlackHex()],
            },
          }),
        );
      } else if (selectedColor === 1) {
        dispatch(
          entitiesActions.editPalette({
            paletteId,
            changes: {
              colors: [getWhiteHex(), newHex, getDarkHex(), getBlackHex()],
            },
          }),
        );
      } else if (selectedColor === 2) {
        dispatch(
          entitiesActions.editPalette({
            paletteId,
            changes: {
              colors: [getWhiteHex(), getLightHex(), newHex, getBlackHex()],
            },
          }),
        );
      } else if (selectedColor === 3) {
        dispatch(
          entitiesActions.editPalette({
            paletteId,
            changes: {
              colors: [getWhiteHex(), getLightHex(), getDarkHex(), newHex],
            },
          }),
        );
      }
    },
    [
      dispatch,
      getBlackHex,
      getDarkHex,
      getLightHex,
      getWhiteHex,
      paletteId,
      selectedColor,
    ],
  );

  const updateColorFromRGB = useCallback(
    (r: number, g: number, b: number) => {
      const hexString =
        decimalToHexString(Math.round((r / 31) * 255)) +
        decimalToHexString(Math.round((g / 31) * 255)) +
        decimalToHexString(Math.round((b / 31) * 255));

      updateCurrentColor(hexString);

      const hsv = RGBtoHSV(r * 8, g * 8, b * 8);

      setColorH(Math.floor(hsv.h * 360));
      setColorS(Math.floor(hsv.s * 100));
      setColorV(Math.floor(hsv.v * 100));
      setCurrentCustomHex(
        "#" + hex2GBChex(hexString, colorCorrection).toLowerCase(),
      );
    },
    [updateCurrentColor, colorCorrection],
  );

  const updateColorFromHSV = useCallback(
    (h: number, s: number, v: number) => {
      const rgb = HSVtoRGB(h / 360, s / 100, v / 100);

      let r = Math.round(rgb.r / 8);
      let g = Math.round(rgb.g / 8);
      let b = Math.round(rgb.b / 8);

      if (r > 31) r = 31;
      if (g > 31) g = 31;
      if (b > 31) b = 31;

      const hexString =
        decimalToHexString(r * 8) +
        decimalToHexString(g * 8) +
        decimalToHexString(b * 8);

      updateCurrentColor(hexString);
      setColorR(r);
      setColorG(g);
      setColorB(b);
      setCurrentCustomHex(
        "#" + hex2GBChex(hexString, colorCorrection).toLowerCase(),
      );
    },
    [updateCurrentColor, colorCorrection],
  );

  const applyHexToState = useCallback((hex: string) => {
    let r = hexToDecimal(hex.substring(0, 2)) / 8;
    let g = hexToDecimal(hex.substring(2, 4)) / 8;
    let b = hexToDecimal(hex.substring(4)) / 8;

    if (r > 31) r = 31;
    if (g > 31) g = 31;
    if (b > 31) b = 31;

    const hsv = RGBtoHSV(r * 8, g * 8, b * 8);

    r = Math.floor(r);
    g = Math.floor(g);
    b = Math.floor(b);

    setColorR(r);
    setColorG(g);
    setColorB(b);
    setColorH(Math.floor(hsv.h * 360));
    setColorS(Math.floor(hsv.s * 100));
    setColorV(Math.floor(hsv.v * 100));
  }, []);

  const onColorSelect = useCallback(
    (colorIndex: ColorIndex) => {
      let editHex = "000000";
      if (colorIndex === 0) {
        editHex = getWhiteHex();
      } else if (colorIndex === 1) {
        editHex = getLightHex();
      } else if (colorIndex === 2) {
        editHex = getDarkHex();
      } else if (colorIndex === 3) {
        editHex = getBlackHex();
      }
      setSelectedColor(colorIndex);
      setCurrentCustomHex(
        "#" + hex2GBChex(editHex, colorCorrection).toLowerCase(),
      );
      applyHexToState(editHex);
    },
    [
      applyHexToState,
      getBlackHex,
      getDarkHex,
      getLightHex,
      getWhiteHex,
      colorCorrection,
    ],
  );

  const onHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsedValue = e.target.value.replace(/[^#A-Fa-f0-9]/g, "");
      const croppedValue = parsedValue.startsWith("#")
        ? parsedValue.substring(0, 7)
        : parsedValue.substring(0, 6);
      setCurrentCustomHex(croppedValue);
      let hex = croppedValue.replace("#", "");
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      if (hex.length === 6) {
        if (colorCorrection === "default") {
          hex = GBCHexToColorCorrectedHex(hex);
        }
        applyHexToState(hex);
        updateCurrentColor(hex);
      }
    },
    [applyHexToState, updateCurrentColor, colorCorrection],
  );

  const onChangeR = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | number) => {
      const newValue =
        typeof e === "number"
          ? e
          : Number(e.currentTarget ? e.currentTarget.value : e);
      const value = clamp31(newValue);
      setColorR(value);
      updateColorFromRGB(value, colorG, colorB);
    },
    [colorB, colorG, updateColorFromRGB],
  );

  const onChangeG = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | number) => {
      const newValue =
        typeof e === "number"
          ? e
          : Number(e.currentTarget ? e.currentTarget.value : e);
      const value = clamp31(newValue);
      setColorG(value);
      updateColorFromRGB(colorR, value, colorB);
    },
    [colorB, colorR, updateColorFromRGB],
  );

  const onChangeB = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | number) => {
      const newValue =
        typeof e === "number"
          ? e
          : Number(e.currentTarget ? e.currentTarget.value : e);
      const value = clamp31(newValue);
      setColorB(value);
      updateColorFromRGB(colorR, colorG, value);
    },
    [colorG, colorR, updateColorFromRGB],
  );

  const onChangeH = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | number) => {
      const newValue =
        typeof e === "number"
          ? e
          : Number(e.currentTarget ? e.currentTarget.value : e);
      const value = clamp(newValue, 0, 360);
      setColorH(value);
      updateColorFromHSV(value, colorS, colorV);
    },
    [colorS, colorV, updateColorFromHSV],
  );

  const onChangeS = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | number) => {
      const newValue =
        typeof e === "number"
          ? e
          : Number(e.currentTarget ? e.currentTarget.value : e);
      const value = clamp(newValue, 0, 100);
      setColorS(value);
      updateColorFromHSV(colorH, value, colorV);
    },
    [colorH, colorV, updateColorFromHSV],
  );

  const onChangeV = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | number) => {
      const newValue =
        typeof e === "number"
          ? e
          : Number(e.currentTarget ? e.currentTarget.value : e);
      const value = clamp(newValue, 0, 100);
      setColorV(value);
      updateColorFromHSV(colorH, colorS, value);
    },
    [colorH, colorS, updateColorFromHSV],
  );

  const onRemove = useCallback(() => {
    dispatch(entitiesActions.removePalette({ paletteId: paletteId }));
  }, [dispatch, paletteId]);

  const onCopy = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (
        e.target.nodeName !== "BODY" &&
        e.target instanceof HTMLInputElement &&
        e.target.value.length > 0
      ) {
        return;
      }
      e.preventDefault();
      if (palette) {
        API.clipboard.writeText(palette.colors[selectedColor]);
      }
    },
    [palette, selectedColor],
  );

  const initialiseColorValues = useCallback(
    (color: string | undefined, paletteIndex: number) => {
      const editHex = color || defaultColors[paletteIndex];
      setCurrentCustomHex(
        "#" + hex2GBChex(editHex, colorCorrection).toLowerCase(),
      );
      applyHexToState(editHex);
    },
    [applyHexToState, colorCorrection],
  );

  const onPaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName !== "BODY") {
        return;
      }
      e.preventDefault();
      try {
        const clipboardData = await API.clipboard.readText();
        const hexString = clipboardData.replace(/[^A-Fa-f0-9]*/g, "");
        if (hexString.length === 6) {
          updateCurrentColor(hexString);
        }
        initialiseColorValues(hexString, selectedColor);
      } catch (err) {
        // Clipboard isn't pastable, just ignore it
      }
    },
    [initialiseColorValues, selectedColor, updateCurrentColor],
  );

  const onReset = useCallback(() => {
    if (!palette) {
      return;
    }
    initialiseColorValues(
      palette?.defaultColors?.[selectedColor],
      selectedColor,
    );
    dispatch(
      entitiesActions.editPalette({
        paletteId: palette.id,
        changes: {
          colors: palette.defaultColors,
        },
      }),
    );
  }, [dispatch, initialiseColorValues, palette, selectedColor]);

  useEffect(() => {
    window.addEventListener("copy", onCopy);
    window.addEventListener("paste", onPaste);

    return () => {
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("paste", onPaste);
    };
  });

  useEffect(() => {
    if (prevPaletteIdRef.current !== paletteId) {
      initialiseColorValues(palette?.colors[selectedColor], selectedColor);
      prevPaletteIdRef.current = paletteId;
    }
  }, [
    applyHexToState,
    initialiseColorValues,
    palette?.colors,
    paletteId,
    selectedColor,
  ]);

  if (!palette) {
    return <div />;
  }

  return (
    <Wrapper>
      <ColorsWrapper>
        {colorIndexes.map((index) => (
          <ColorButton
            key={index}
            $selected={selectedColor === index}
            className="focus-visible"
            onClick={() => onColorSelect(index)}
            style={{
              background: `#${hex2GBChex(
                palette.colors[index],
                colorCorrection,
              )}`,
            }}
          >
            {index === 0 && <span>{l10n("FIELD_COLOR_LIGHTEST")}</span>}
            {index === 3 && <span>{l10n("FIELD_COLOR_DARKEST")}</span>}
          </ColorButton>
        ))}
      </ColorsWrapper>

      <ColorValueForm>
        <ColorValueFormItem>
          <NumberField
            name="colorR"
            label={`${l10n("FIELD_CUSTOM_RED")} (0-31)`}
            id="colorR"
            type="number"
            value={colorR}
            min={0}
            max={31}
            placeholder="0"
            onChange={onChangeR}
          />
          <ColorSlider
            steps={11}
            value={(colorR || 0) / 31}
            onChange={(value) => onChangeR(Math.round(Number(value) * 31))}
            colorAtValue={(value) => {
              return `#${rgb5BitToGBCHex(
                Math.round(value * 31),
                colorG,
                colorB,
              )}`;
            }}
          />
        </ColorValueFormItem>

        <ColorValueFormItem>
          <NumberField
            name="colorG"
            label={`${l10n("FIELD_CUSTOM_GREEN")} (0-31)`}
            id="colorG"
            type="number"
            value={colorG}
            min={0}
            max={31}
            placeholder="0"
            onChange={onChangeG}
          />
          <ColorSlider
            steps={11}
            value={(colorG || 0) / 31}
            onChange={(value) => onChangeG(Math.round(value * 31))}
            colorAtValue={(value) => {
              return `#${rgb5BitToGBCHex(
                colorR,
                Math.round(value * 31),
                colorB,
              )}`;
            }}
          />
        </ColorValueFormItem>

        <ColorValueFormItem>
          <NumberField
            name="colorB"
            label={`${l10n("FIELD_CUSTOM_BLUE")} (0-31)`}
            id="colorB"
            type="number"
            value={colorB}
            min={0}
            max={31}
            placeholder="0"
            onChange={onChangeB}
          />
          <ColorSlider
            steps={11}
            value={(colorB || 0) / 31}
            onChange={(value) => onChangeB(Math.round(value * 31))}
            colorAtValue={(value) => {
              return `#${rgb5BitToGBCHex(
                colorR,
                colorG,
                Math.round(value * 31),
              )}`;
            }}
          />
        </ColorValueFormItem>

        <ColorValueFormItem>
          <NumberField
            name="colorHue"
            label={`${l10n("FIELD_HUE")} (0-360)`}
            id="colorHue"
            type="number"
            value={colorH}
            min={0}
            max={360}
            placeholder="0"
            onChange={onChangeH}
          />
          <ColorSlider
            steps={60}
            value={(colorH || 0) / 360}
            onChange={(value) => onChangeH(Math.round(value * 360))}
            colorAtValue={(value) => {
              const rgb = HSVtoRGB(value, 1, 1);
              return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
            }}
          />
        </ColorValueFormItem>

        <ColorValueFormItem>
          <NumberField
            name="colorSaturation"
            label={`${l10n("FIELD_SATURATION")} (0-100)`}
            id="colorSaturation"
            type="number"
            value={colorS}
            min={0}
            max={100}
            placeholder="0"
            onChange={onChangeS}
          />
          <ColorSlider
            steps={11}
            value={(colorS || 0) / 100}
            onChange={(value) => onChangeS(Math.round(value * 100))}
            colorAtValue={(value) => {
              const rgb = HSVtoRGB(colorH / 360, value, colorV / 100);
              let r = Math.round(rgb.r / 8);
              let g = Math.round(rgb.g / 8);
              let b = Math.round(rgb.b / 8);
              if (r > 31) r = 31;
              if (g > 31) g = 31;
              if (b > 31) b = 31;
              return `#${rgb5BitToGBCHex(r, g, b)}`;
            }}
          />
        </ColorValueFormItem>

        <ColorValueFormItem>
          <NumberField
            name="colorBrightness"
            label={`${l10n("FIELD_BRIGHTNESS")} (0-100)`}
            id="colorBrightness"
            type="number"
            value={colorV}
            min={0}
            max={100}
            placeholder="0"
            onChange={onChangeV}
          />
          <ColorSlider
            steps={11}
            value={(colorV || 0) / 100}
            onChange={(value) => onChangeV(Math.round(value * 100))}
            colorAtValue={(value) => {
              const rgb = HSVtoRGB(colorH / 360, colorS / 100, value);
              let r = Math.round(rgb.r / 8);
              let g = Math.round(rgb.g / 8);
              let b = Math.round(rgb.b / 8);
              if (r > 31) r = 31;
              if (g > 31) g = 31;
              if (b > 31) b = 31;
              return `#${rgb5BitToGBCHex(r, g, b)}`;
            }}
          />
        </ColorValueFormItem>
      </ColorValueForm>

      <TextField
        name="colorHex"
        label={`${l10n("FIELD_HEX_COLOR")} (${l10n("FIELD_CLOSEST_MATCH")})`}
        size="large"
        maxLength={7}
        placeholder="#000000"
        value={currentCustomHex}
        onChange={onHexChange}
      />
      <FixedSpacer height={20} />
      <div>
        {palette.defaultColors ? (
          <Button onClick={onReset}>{l10n("FIELD_RESET_PALETTE")}</Button>
        ) : (
          <Button onClick={onRemove}>{l10n("FIELD_REMOVE_PALETTE")}</Button>
        )}
      </div>
    </Wrapper>
  );
};

export default CustomPalettePicker;
