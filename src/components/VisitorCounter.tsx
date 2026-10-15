import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

// Use a unique key so it doesn't collide with anyone else's counter
// (all keys on this free service are public, so keep it distinctive).
// Defaults to one per site address, so each deployment counts its own visits.
const COUNTER_KEY = (
  import.meta.env.VITE_VISITOR_COUNTER_KEY || `portfolio_visits_${window.location.hostname}`
).replace(/[^a-zA-Z0-9_-]/g, '_');
const API_BASE = 'https://countapi.mileshilliard.com/api/v1';

const VisitorCounter = () => {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Guard against double-fires (React StrictMode, re-renders)
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Only increment once per browser session; on repeat visits within
    // the same session, just read the current value instead
    const alreadyCounted = sessionStorage.getItem('portfolio_visit_counted');
    const endpoint = alreadyCounted
      ? `${API_BASE}/get/${COUNTER_KEY}`
      : `${API_BASE}/hit/${COUNTER_KEY}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.value !== 'undefined' && data.value !== null) {
          setCount(Number(data.value));
          sessionStorage.setItem('portfolio_visit_counted', 'true');
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null; // fail silently, don't break the sidebar

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4 border-t border-gray-200">
      <motion.span
        animate={{ scale: count === null ? [1, 1.15, 1] : 1 }}
        transition={{ duration: 1.2, repeat: count === null ? Infinity : 0 }}
        className="text-purple-600"
      >
        <Eye size={16} />
      </motion.span>
      {count === null ? (
        <span className="text-gray-400">Counting visits…</span>
      ) : (
        <motion.span
          key={count}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="font-medium text-gray-700"
        >
          {count.toLocaleString()} visits
        </motion.span>
      )}
    </div>
  );
};

export default VisitorCounter;