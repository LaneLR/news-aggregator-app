"use client";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Newspaper, Columns3, Lock } from "lucide-react";
import styles from "./ViewDensityToggle.module.scss";

// Card and Reader (3-pane) are core navigation, so they stay free — same
// reasoning as ungating dark mode earlier this session. List/Magazine are
// cosmetic density skins in the Feedly-Pro mold, so those stay gated.
const OPTIONS = [
  { value: "reader", label: "Reader (3-pane)", Icon: Columns3, subscriberOnly: false },
  { value: "card", label: "Card", Icon: LayoutGrid, subscriberOnly: false },
  { value: "list", label: "List", Icon: List, subscriberOnly: true },
  { value: "magazine", label: "Magazine", Icon: Newspaper, subscriberOnly: true },
];

export default function ViewDensityToggle({ density, onChange, isSubscribed }) {
  const router = useRouter();

  return (
    <div className={styles.toggle}>
      {OPTIONS.map(({ value, label, Icon, subscriberOnly }) => {
        const locked = subscriberOnly && !isSubscribed;
        return (
          <button
            key={value}
            type="button"
            className={`${styles.option} ${density === value ? styles.active : ""}`}
            onClick={() => (locked ? router.push("/pricing") : onChange(value))}
            title={locked ? `${label} view — Subscribed feature` : `${label} view`}
            aria-label={locked ? `${label} view — Subscribed feature` : `${label} view`}
            aria-pressed={density === value}
          >
            {locked ? <Lock size={15} strokeWidth={2} /> : <Icon size={15} strokeWidth={2} />}
          </button>
        );
      })}
    </div>
  );
}
