"use client";
import React, { useState } from "react";

const App = () => {
  const [geraltDice, setGeraltDice] = useState(["1", "1", 1, 1, 1]);
  const [opponentDice, setOpponentDice] = useState([1, 1, 1, 1, 1]);
  const [results, setResults] = useState(null);
  const [probabilities, setProbabilities] = useState(null);

  const handleChange = (e, index, setter) => {
    let value = parseInt(e.target.value);
    if (isNaN(value)) value = e.target.value;
    setter((prev) => {
      const newDice = [...prev];
      newDice[index] = value;
      return newDice;
    });
  };

  const determineHand = (dice) => {
    const counts = Array(6).fill(0);
    dice.forEach((d) => counts[d - 1]++);
    counts.sort((a, b) => b - a);

    const diceValueToCountMap = {};
    dice.forEach((d) => {
      diceValueToCountMap[d] = (diceValueToCountMap[d] || 0) + 1;
    });

    if (counts[0] === 5) return { hand: "Five of a Kind", keep: dice };
    if (counts[0] === 4) return { hand: "Four of a Kind", keep: dice.filter((d) => diceValueToCountMap[d] >= 4) };
    if (counts[0] === 3 && counts[1] === 2) return { hand: "Full House", keep: dice };
    if (counts[0] === 3) return { hand: "Three of a Kind", keep: dice.filter((d) => diceValueToCountMap[d] >= 3) };
    if (counts[0] === 2 && counts[1] === 2) return { hand: "Two Pairs", keep: dice.filter((d) => diceValueToCountMap[d] >= 2) };
    if (counts[0] === 2) return { hand: "Pair", keep: dice.filter((d) => diceValueToCountMap[d] >= 2) };
    const sortedDice = [...new Set(dice)].sort((a, b) => a - b);
    if (sortedDice.join("") === "12345") return { hand: "Five High Straight", keep: dice };
    if (sortedDice.join("") === "23456") return { hand: "Six High Straight", keep: dice };
    return { hand: "Nothing", keep: [] };
  };

  const calculateProbabilities = (rerollDice, keep) => {
    const totalOutcomes = Math.pow(6, rerollDice.length);
    const allOutcomes = [];
    const generateOutcomes = (current, depth) => {
      if (depth === rerollDice.length) {
        allOutcomes.push([...current]);
        return;
      }
      for (let i = 1; i <= 6; i++) {
        generateOutcomes([...current, i], depth + 1);
      }
    };
    generateOutcomes([], 0);

    const handCounts = {
      Nothing: 0,
      Pair: 0,
      "Two Pairs": 0,
      "Three of a Kind": 0,
      "Five High Straight": 0,
      "Six High Straight": 0,
      "Full House": 0,
      "Four of a Kind": 0,
      "Five of a Kind": 0,
    };

    allOutcomes.forEach((outcome) => {
      const combinedDice = [...keep, ...outcome];
      const hand = determineHand(combinedDice);
      handCounts[hand.hand]++;
    });

    return Object.keys(handCounts).map((hand) => ({
      hand,
      chance: ((handCounts[hand] / totalOutcomes) * 100).toFixed(2),
    }));
  };

  const calculateOdds = () => {

    stop = false
    geraltDice.forEach((d) => { let num = parseInt(d); if (isNaN(num) || num < 1 || num > 6) { stop = true; } });
    const geraltHand = determineHand(geraltDice);
    if (stop) return;
    opponentDice.forEach((d) => { let num = parseInt(d); if (isNaN(num) || num < 1 || num > 6) { stop = true; } });
    const opponentHand = determineHand(opponentDice);
    if (stop) return;


    const geraltRerollDice = geraltDice.filter((d) => !geraltHand.keep.includes(d));
    const opponentRerollDice = opponentDice.filter((d) => !opponentHand.keep.includes(d));

    const geraltProbabilities = calculateProbabilities(geraltRerollDice, geraltHand.keep);
    const opponentProbabilities = calculateProbabilities(opponentRerollDice, opponentHand.keep);

    // Consider opponent&apos;s potential outcomes to adjust Geralt&apos;s strategy
    const opponentBestChance = Math.max(...opponentProbabilities.map((p) => parseFloat(p.chance)));
    const opponentLikelyHand = opponentProbabilities.find(
      (p) => parseFloat(p.chance) === opponentBestChance
    )?.hand;

    const geraltStrategy =
      opponentHand.hand === geraltHand.hand
        ? "Re-roll to break the tie or raise the stakes."
        : geraltHand.hand > opponentHand.hand
          ? "Keep current dice and raise."
          : `Re-roll to improve. Beware: opponent has a likely ${opponentLikelyHand}.`;

    setResults({
      geraltHand: geraltHand.hand,
      opponentHand: opponentHand.hand,
      geraltRerollDice,
      opponentRerollDice,
      suggestion: geraltStrategy,
      opponentSuggestion:
        opponentHand.hand > geraltHand.hand
          ? "Opponent should raise stakes."
          : "Opponent may re-roll to improve chances.",
    });

    setProbabilities({
      geralt: geraltProbabilities,
      opponent: opponentProbabilities,
    });
  };

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">Dice Poker Odds Calculator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold">Geralt&apos;s Dice</h2>
          {geraltDice.map((d, i) => (
            <input
              key={i}
              type="text"
              value={d}
              min="1"
              max="6"
              onChange={(e) => handleChange(e, i, setGeraltDice)}
              className="w-12 h-12 text-center border rounded m-1"
            />
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Opponent&apos;s Dice</h2>
          {opponentDice.map((d, i) => (
            <input
              key={i}
              type="text"
              value={d}
              min="1"
              max="6"
              onChange={(e) => handleChange(e, i, setOpponentDice)}
              className="w-12 h-12 text-center border rounded m-1"
            />
          ))}
        </div>
      </div>

      <button
        onClick={calculateOdds}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        Calculate Odds
      </button>

      {results && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Results</h2>
          <p>Geralt&apos;s Hand: {results.geraltHand}</p>
          <p>Opponent&apos;s Hand: {results.opponentHand}</p>
          <p>Geralt&apos;s Dice to Re-roll: {results.geraltRerollDice.length > 0 ? results.geraltRerollDice.join(", ") : "None"}</p>
          <p>Opponent&apos;s Dice to Re-roll: {results.opponentRerollDice.length > 0 ? results.opponentRerollDice.join(", ") : "None"}</p>
          <p>Geralt&apos;s Suggestion: {results.suggestion}</p>
          <p>Opponent&apos;s Suggestion: {results.opponentSuggestion}</p>
        </div>
      )}

      {probabilities && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Probability Tables</h2>

          <div className="mt-4">
            <h3 className="text-md font-medium">Geralt&apos;s Probabilities</h3>
            <table className="table-auto w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Hand</th>
                  <th className="border border-gray-300 px-4 py-2">Chance (%)</th>
                </tr>
              </thead>
              <tbody>
                {probabilities.geralt.map((prob, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{prob.hand}</td>
                    <td className="border border-gray-300 px-4 py-2">{prob.chance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <h3 className="text-md font-medium">Opponent&apos;s Probabilities</h3>
            <table className="table-auto w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Hand</th>
                  <th className="border border-gray-300 px-4 py-2">Chance (%)</th>
                </tr>
              </thead>
              <tbody>
                {probabilities.opponent.map((prob, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{prob.hand}</td>
                    <td className="border border-gray-300 px-4 py-2">{prob.chance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
