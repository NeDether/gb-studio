import React, { useCallback, useEffect, useState } from "react";
import uniq from "lodash/uniq";
import { musicSelectors } from "store/features/entities/entitiesState";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  OptGroup,
  FormatFolderLabel,
} from "ui/form/Select";
import { PauseIcon, PlayIcon } from "ui/icons/Icons";
import { Button } from "ui/buttons/Button";
import musicActions from "store/features/music/musicActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SingleValue } from "react-select";

interface MusicSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

interface PlayPauseTrackProps extends SelectCommonProps {
  musicId: string;
}

export const PlayPauseTrack = ({ musicId }: PlayPauseTrackProps) => {
  const dispatch = useAppDispatch();
  const musicPlaying = useAppSelector((state) => state.music.playing);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (musicPlaying) {
        dispatch(musicActions.pauseMusic());
      } else {
        dispatch(musicActions.playMusic({ musicId }));
      }
    },
    [dispatch, musicId, musicPlaying],
  );

  return (
    <Button
      size="small"
      variant="transparent"
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {musicPlaying ? <PauseIcon /> : <PlayIcon />}
    </Button>
  );
};

export const MusicSelect = ({
  value,
  onChange,
  ...selectProps
}: MusicSelectProps) => {
  const tracks = useAppSelector((state) => musicSelectors.selectAll(state));
  const musicDriver = useAppSelector(
    (state) => state.project.present.settings.musicDriver,
  );

  const [options, setOptions] = useState<OptGroup[]>([]);
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    const driverTracks = tracks.filter(
      (track) =>
        (musicDriver === "huge" && track.type === "uge") ||
        (musicDriver !== "huge" && track.type !== "uge"),
    );
    const plugins = uniq(driverTracks.map((s) => s.plugin || "")).sort();
    setOptions(
      plugins.map((pluginKey) => ({
        label: pluginKey,
        options: driverTracks
          .filter((track) => (track.plugin || "") === pluginKey)
          .map((track) => ({
            label: track.name,
            value: track.id,
          })),
      })),
    );
  }, [tracks, musicDriver]);

  useEffect(() => {
    let option: Option | null = null;
    options.find((optGroup) => {
      const foundOption = optGroup.options.find((opt) => opt.value === value);
      if (foundOption) {
        option = foundOption;
        return true;
      }
      return false;
    });
    setCurrentValue(option || options[0]?.options[0]);
  }, [options, value]);

  const onSelectChange = useCallback(
    (newValue: SingleValue<Option>) => {
      if (newValue) {
        onChange?.(newValue.value);
      }
    },
    [onChange],
  );

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(option: Option) => {
        return (
          <OptionLabelWithPreview
            preview={<PlayPauseTrack musicId={option.value} />}
          >
            <FormatFolderLabel label={option.label} />
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={<PlayPauseTrack musicId={currentValue?.value || ""} />}
          >
            <FormatFolderLabel label={currentValue?.label} />
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};
