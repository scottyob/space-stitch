import { ProgressMode } from "../types";

export default function ProgressSettings(props: {
  progressMode: ProgressMode;
  updateProgressMode: (progressMode: ProgressMode) => void;
}) {
  const { progressMode } = props;

  return (
    <div className="bg-gray-100 rounded-md p-2 mr-8">
      <ProgressSetting
        progressMode={ProgressMode.Stitch}
        selectedMode={progressMode}
        setSelected={props.updateProgressMode}
      />
      <ProgressSetting
        progressMode={ProgressMode.Group}
        selectedMode={progressMode}
        setSelected={props.updateProgressMode}
      />
      <ProgressSetting
        progressMode={ProgressMode.Round}
        selectedMode={progressMode}
        setSelected={props.updateProgressMode}
      />
    </div>
  );
}

function ProgressSetting(props: {
  progressMode: ProgressMode;
  selectedMode: ProgressMode;
  setSelected: (p: ProgressMode) => void;
}) {
  const { progressMode, selectedMode } = props;

  const settingStyles = {
    all: "border-gray-200 border m-4 p-1 text-center rounded-md bg-gray-200",
    selected: "bg-green-400 text-white",
    unselected: "bg-gray-200",
  };
  const selected = [settingStyles.all, settingStyles.selected].join(" ");
  const unselected = [settingStyles.all, settingStyles.unselected].join(" ");

  return (
    <div
      onClick={() => props.setSelected(progressMode)}
      className={progressMode == selectedMode ? selected : unselected}
    >
      {progressMode}
    </div>
  );
}
