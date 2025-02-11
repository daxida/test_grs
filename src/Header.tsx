import classNames from "classnames";
import RepoButton from "./RepoButton";
import { Theme } from "./theme";

export default function Header({
  theme,
  onChangeTheme,
}: {
  theme: Theme;
  onChangeTheme: (theme: Theme) => void;
}) {
  return (
    <div
      className={classNames(
        "w-full",
        "flex",
        "justify-between",
        "pl-5",
        "sm:pl-1",
        "pr-4",
        "lg:pr-6",
        "z-10",
        "top-0",
        "left-0",
        "-mb-px",
        "antialiased",
        "border-b",
        "border-gray-200",
        "dark:border-b-radiate",
        "dark:bg-galaxy",
      )}
    >
      <div className="text-3xl"> GRS </div>
      <div className="flex items-center min-w-0">
        <RepoButton />
        <Divider />
        <ThemeButton theme={theme} onChangeTheme={onChangeTheme} />
      </div>
    </div>
  );
};

function ThemeButton({
  theme,
  onChangeTheme,
}: {
  theme: Theme;
  onChangeTheme: (theme: Theme) => void;
}) {
  return (
    <button
      onClick={() => onChangeTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? "Dark Mode" : "Light Mode"}
    </button>
  );
}

function Divider() {
  return (
    <div className="hidden sm:block mx-6 lg:mx-4 w-px h-8 bg-gray-200 dark:bg-gray-700" />
  );
}
