import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

const OPTIONS = {
  system: { label: "System theme", Icon: Monitor, next: "light" },
  light: { label: "Light theme", Icon: Sun, next: "dark" },
  dark: { label: "Dark theme", Icon: Moon, next: "system" },
};

/**
 * Cycles the colour theme: system, light, dark.
 * The label names the current setting and the one a press switches to.
 */
const ThemeToggle = ({ className = "" }) => {
  const { preference, setPreference } = useTheme();
  const { label, Icon, next } = OPTIONS[preference];
  const nextLabel = OPTIONS[next].label.toLowerCase();

  return (
    <button
      type='button'
      onClick={() => setPreference(next)}
      className={`p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 ${className}`}
      aria-label={`${label}. Switch to ${nextLabel}`}
      title={`${label} (switch to ${nextLabel})`}
    >
      <Icon size={20} aria-hidden='true' />
    </button>
  );
};

export default ThemeToggle;
