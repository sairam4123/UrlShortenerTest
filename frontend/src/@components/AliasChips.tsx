import { motion } from "framer-motion";

export default function AliasChips({
  aliases,
  onAliasSelected,
  length,
}: {
  aliases: string[];
  onAliasSelected: (alias: string) => void;
  length: number;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-4 overflow-x-auto">
      {!aliases.length && length && (
        <>
          {Array.from({ length }).map((_, index) => (
            <SkeletonChip key={index} />
          ))}
        </>
      )}
      {aliases.map((alias) => (
        <motion.span
          onClick={() => onAliasSelected(alias)}
          key={alias}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:from-blue-500 hover:to-blue-400 transition-all active:scale-95 shadow-md shadow-blue-900/40 font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {alias}
        </motion.span>
      ))}
    </div>
  );
}

export function SkeletonChip() {
  return (
    <motion.div className="h-10 w-24 rounded-lg bg-gradient-to-r from-blue-600/30 to-blue-500/30 border border-blue-500/20 overflow-hidden shadow-md shadow-blue-900/20">
      <motion.div
        className="h-full w-full bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
        animate={{ x: ["-150%", "150%"] }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
