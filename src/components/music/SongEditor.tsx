import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import { FormContainer, FormHeader, FormRow } from "ui/form/layout/FormLayout";
import { Sidebar, SidebarColumn, SidebarColumns } from "ui/sidebars/Sidebar";
import { Label } from "ui/form/Label";
import { Input } from "ui/form/Input";
import { InstrumentDutyEditor } from "./InstrumentDutyEditor";
import { InstrumentWaveEditor } from "./InstrumentWaveEditor";
import { InstrumentNoiseEditor } from "./InstrumentNoiseEditor";
import { Song } from "shared/lib/uge/song/Song";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import l10n from "shared/lib/lang/l10n";
import {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "store/features/trackerDocument/trackerDocumentTypes";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { MenuItem } from "ui/menu/Menu";
import { PatternCellEditor } from "./PatternCellEditor";
import trackerActions from "store/features/tracker/trackerActions";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { InstrumentSubpatternEditor } from "./InstrumentSubpatternEditor";
import styled from "styled-components";
import { NumberInput } from "ui/form/NumberInput";
import { useAppDispatch, useAppSelector } from "store/hooks";

type Instrument = DutyInstrument | NoiseInstrument | WaveInstrument;

type InstrumentEditorTab = "main" | "subpattern";
type InstrumentEditorTabs = { [key in InstrumentEditorTab]: string };

const InstrumentEditorWrapper = styled.div`
  padding-top: 10px;
`;

const renderInstrumentEditor = (
  type: string,
  instrumentData: Instrument | null,
  waveForms?: Uint8Array[],
) => {
  if (type === "duty")
    return (
      <InstrumentDutyEditor
        id={`instrument_${instrumentData?.index}`}
        instrument={instrumentData as DutyInstrument}
      />
    );

  if (type === "noise")
    return (
      <InstrumentNoiseEditor
        id={`instrument_${instrumentData?.index}`}
        instrument={instrumentData as NoiseInstrument}
      />
    );

  if (type === "wave")
    return (
      <InstrumentWaveEditor
        id={`instrument_${instrumentData?.index}`}
        instrument={instrumentData as WaveInstrument}
        waveForms={waveForms}
      />
    );
};

const instrumentName = (instrument: Instrument, type: string) => {
  let typeName = "Instrument";
  if (type === "duty") typeName = "Duty";
  if (type === "wave") typeName = "Wave";
  if (type === "noise") typeName = "Noise";

  return instrument.name
    ? instrument.name
    : `${typeName} ${instrument.index + 1}`;
};

export const SongEditor = () => {
  const dispatch = useAppDispatch();
  const selectedInstrument = useAppSelector(
    (state) => state.editor.selectedInstrument,
  );
  useEffect(() => {
    dispatch(trackerActions.setSelectedEffectCell(null));
  }, [dispatch, selectedInstrument]);
  const sequenceId = useAppSelector((state) => state.editor.selectedSequence);
  const song = useAppSelector((state) => state.trackerDocument.present.song);

  const selectSidebar = () => {};

  const onChangeSongProp = useCallback(
    <K extends keyof Song>(key: K, value: Song[K]) => {
      dispatch(
        trackerDocumentActions.editSong({
          changes: {
            [key]: value,
          },
        }),
      );
    },
    [dispatch],
  );

  const onChangeName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSongProp("name", e.currentTarget.value),
    [onChangeSongProp],
  );

  const onChangeArtist = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSongProp("artist", e.currentTarget.value),
    [onChangeSongProp],
  );

  const onChangeTicksPerRow = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSongProp("ticks_per_row", castEventToInt(e, 0)),
    [onChangeSongProp],
  );

  const onChangeInstrumentName =
    (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const editValue = e.currentTarget.value;

      let action;
      if (type === "duty") action = trackerDocumentActions.editDutyInstrument;
      if (type === "wave") action = trackerDocumentActions.editWaveInstrument;
      if (type === "noise") action = trackerDocumentActions.editNoiseInstrument;

      if (!action || !instrumentData) return;

      dispatch(
        action({
          instrumentId: instrumentData.index,
          changes: {
            name: editValue,
          },
        }),
      );
    };

  let instrumentData: Instrument | null = null;
  if (song) {
    const selectedInstrumentId = parseInt(selectedInstrument.id);
    switch (selectedInstrument.type) {
      case "duty":
        instrumentData = song.duty_instruments[selectedInstrumentId];
        break;
      case "noise":
        instrumentData = song.noise_instruments[selectedInstrumentId];
        break;
      case "wave":
        instrumentData = song.wave_instruments[selectedInstrumentId];
        break;
    }
  }

  const onRemovePattern = useCallback(() => {
    dispatch(
      trackerDocumentActions.removeSequence({
        sequenceIndex: sequenceId,
      }),
    );
  }, [dispatch, sequenceId]);

  const selectedEffectCell = useAppSelector(
    (state) => state.tracker.selectedEffectCell,
  );

  const patternId = song?.sequence[sequenceId] || 0;

  const [instrumentEditorTab, setInstrumentEditorTab] =
    useState<InstrumentEditorTab>("main");
  const onInstrumentEditorChange = useCallback((mode: InstrumentEditorTab) => {
    setInstrumentEditorTab(mode);
  }, []);

  const instrumentEditorTabs = useMemo(
    () =>
      ({
        main: l10n("SIDEBAR_INSTRUMENT"),
        subpattern: l10n("SIDEBAR_SUBPATTERN"),
      }) as InstrumentEditorTabs,
    [],
  );

  if (!song) {
    return null;
  }

  return (
    <Sidebar onClick={selectSidebar}>
      <FormHeader>
        <EditableText
          name="name"
          placeholder="Song"
          value={song?.name || ""}
          onChange={onChangeName}
        />

        <DropdownButton
          size="small"
          variant="transparent"
          menuDirection="right"
        >
          <MenuItem onClick={onRemovePattern}>
            {l10n("MENU_PATTERN_DELETE")}
          </MenuItem>
        </DropdownButton>
      </FormHeader>
      <SidebarColumns>
        <SidebarColumn>
          <FormRow>
            <Label htmlFor="artist">{l10n("FIELD_ARTIST")}</Label>
          </FormRow>
          <FormRow>
            <Input
              name="artist"
              value={song?.artist}
              onChange={onChangeArtist}
            />
          </FormRow>
        </SidebarColumn>
        <SidebarColumn>
          <FormRow>
            <Label htmlFor="ticks_per_row">{l10n("FIELD_TEMPO")}</Label>
          </FormRow>
          <FormRow>
            <NumberInput
              name="ticks_per_row"
              type="number"
              value={song?.ticks_per_row}
              min={0}
              max={20}
              placeholder="0"
              onChange={onChangeTicksPerRow}
              title={l10n("FIELD_TEMPO_TOOLTIP")}
            />
          </FormRow>
        </SidebarColumn>
      </SidebarColumns>

      <FormContainer>
        {selectedEffectCell !== null ? (
          <div style={{ marginTop: -1 }}>
            <PatternCellEditor
              id={selectedEffectCell}
              patternId={patternId}
              pattern={song?.patterns[patternId][selectedEffectCell]}
            />
          </div>
        ) : instrumentData ? (
          <>
            <FormHeader>
              <EditableText
                name="instrumentName"
                placeholder={instrumentName(
                  instrumentData,
                  selectedInstrument.type,
                )}
                value={instrumentData.name || ""}
                onChange={onChangeInstrumentName(selectedInstrument.type)}
              />

              {/* <DropdownButton
                  size="small"
                  variant="transparent"
                  menuDirection="right"
                >
                  <MenuItem onClick={onCopyVar}>
                  {l10n("MENU_VARIABLE_COPY_EMBED")}
                </MenuItem>
                <MenuItem onClick={onCopyChar}>
                  {l10n("MENU_VARIABLE_COPY_EMBED_CHAR")}
                </MenuItem>
                </DropdownButton> */}
            </FormHeader>

            <StickyTabs>
              <TabBar
                value={instrumentEditorTab}
                values={instrumentEditorTabs}
                onChange={onInstrumentEditorChange}
              />
            </StickyTabs>
            <InstrumentEditorWrapper>
              {instrumentEditorTab === "main" ? (
                <>
                  {renderInstrumentEditor(
                    selectedInstrument.type,
                    instrumentData,
                    song.waves,
                  )}
                </>
              ) : (
                <InstrumentSubpatternEditor
                  enabled={instrumentData.subpattern_enabled}
                  subpattern={instrumentData.subpattern}
                  instrumentId={instrumentData.index}
                  instrumentType={selectedInstrument.type}
                />
              )}
            </InstrumentEditorWrapper>
          </>
        ) : (
          ""
        )}
      </FormContainer>
    </Sidebar>
  );
};
