import l10n from "shared/lib/lang/l10n";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { MusicDriverSetting } from "store/features/settings/settingsState";
import {
  Option,
  OptionLabelWithInfo,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import { SingleValue } from "react-select";

interface MusicDriverSelectProps extends SelectCommonProps {
  name: string;
  value?: MusicDriverSetting;
  onChange?: (newId: MusicDriverSetting) => void;
}

export interface MusicDriverOption {
  value: MusicDriverSetting;
  label: string;
}

const musicDriverOptions: MusicDriverOption[] = [
  {
    label: "UGE",
    value: "huge",
  },
  {
    label: "MOD",
    value: "gbt",
  },
];

export const MusicDriverSelect: FC<MusicDriverSelectProps> = ({
  value,
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<MusicDriverOption>();
  const musicDriverOptionsInfo: { [key: string]: string } = useMemo(
    () => ({
      huge: l10n("FIELD_HUGE_DRIVER_INFO"),
      gbt: l10n("FIELD_GBT_PLAYER_INFO"),
    }),
    [],
  );

  useEffect(() => {
    const currentMusicDriver = musicDriverOptions.find(
      (e) => e.value === value,
    );
    if (currentMusicDriver) {
      setCurrentValue(currentMusicDriver);
    }
  }, [value]);

  const onSelectChange = useCallback(
    (newValue: SingleValue<MusicDriverOption>) => {
      if (newValue) {
        onChange?.(newValue.value);
      }
    },
    [onChange],
  );

  return (
    <Select
      value={currentValue}
      options={musicDriverOptions}
      onChange={onSelectChange}
      formatOptionLabel={(
        option: Option,
        { context }: { context: "menu" | "value" },
      ) => {
        return (
          <OptionLabelWithInfo
            info={
              context === "menu" ? musicDriverOptionsInfo[option.value] : ""
            }
          >
            {option.label}
            {context === "value"
              ? ` (${musicDriverOptionsInfo[option.value]})`
              : ""}
          </OptionLabelWithInfo>
        );
      }}
    />
  );
};
