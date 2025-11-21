
const COMMENTARY_TEMPLATES: Record<string, string[]> = {
    "Rent": [
        "{player} just got fleeced!",
        "Ouch! {player}'s wallet is crying.",
        "Transferring funds... {player} is not happy.",
        "Landlords, am I right?",
        "There goes the profit margin for {player}.",
        "That's a heavy toll, {player}.",
        "Money flows from {player} to the owner."
    ],
    "Buy": [
        "{player} is building an empire!",
        "Prime real estate acquired by {player}.",
        "A solid investment by {player}.",
        "{player} is taking over the board.",
        "Location, location, location!",
        "Smart move, {player}.",
        "Another property for {player}'s portfolio."
    ],
    "Jail": [
        "Lock them up! {player} is down.",
        "{player} needs a good lawyer.",
        "Enjoy the synth-gruel, {player}.",
        "Busted! {player} is in the slammer.",
        "System error: {player} detained.",
        "Do not pass Go, {player}."
    ],
    "Bankrupt": [
        "Game Over for {player}!",
        "{player} has flatlined financially.",
        "Liquidation complete. Bye {player}!",
        "System failure: {player} is out.",
        "Total financial collapse for {player}."
    ],
    "Hospital": [
        "System recharge initiated for {player}.",
        "{player} is offline for maintenance.",
        "Get well soon, {player}.",
        "Medical bills incoming for {player}?"
    ],
    "Bank": [
         "{player} is dealing with the loan sharks.",
         "Financial maneuvering by {player}.",
         "Interest rates are killer, {player}.",
         "{player} is trying to balance the books."
    ],
    "Start": [
        "Payday for {player}!",
        "Stimulus credits received.",
        "Go, {player}, Go!"
    ],
    "Default": [
        "Interesting move by {player}.",
        "Let's see how this plays out for {player}.",
        "{player} is making moves.",
        "The game heats up.",
        "Roll the dice, take the chance."
    ]
};

export const getGeminiCommentary = async (
  playerName: string,
  event: string,
  gameStateSummary: string
): Promise<string> => {
    // Return immediately or with a slight simulated delay for effect
    await new Promise(resolve => setTimeout(resolve, 300));

    let category = "Default";
    const lowerEvent = event.toLowerCase();

    if (lowerEvent.includes("rent") || lowerEvent.includes("paid")) category = "Rent";
    else if (lowerEvent.includes("bought") || lowerEvent.includes("buy")) category = "Buy";
    else if (lowerEvent.includes("jail") || lowerEvent.includes("arrest")) category = "Jail";
    else if (lowerEvent.includes("bankrupt")) category = "Bankrupt";
    else if (lowerEvent.includes("hospital")) category = "Hospital";
    else if (lowerEvent.includes("borrow") || lowerEvent.includes("repay") || lowerEvent.includes("bank")) category = "Bank";
    else if (lowerEvent.includes("start") || lowerEvent.includes("go")) category = "Start";

    const templates = COMMENTARY_TEMPLATES[category] || COMMENTARY_TEMPLATES["Default"];
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template.replace(/{player}/g, playerName);
};

export const generateChanceEvent = async (): Promise<{ description: string; effectType: 'MONEY' | 'MOVE'; value: number }> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

    const events = [
      { description: "Found a crypto wallet on the ground.", effectType: 'MONEY', value: 100 },
      { description: "Server crash! Pay for repairs.", effectType: 'MONEY', value: -100 },
      { description: "Speed boost hack enabled.", effectType: 'MOVE', value: 3 },
      { description: "Hit a firewall. Move back.", effectType: 'MOVE', value: -2 },
      { description: "Won a hackathon!", effectType: 'MONEY', value: 200 },
      { description: "Caught by cyber-police. Bribe paid.", effectType: 'MONEY', value: -150 },
      { description: "Stock market crash.", effectType: 'MONEY', value: -200 },
      { description: "Tax refund received.", effectType: 'MONEY', value: 50 },
      { description: "Short circuit in the suit.", effectType: 'MOVE', value: -1 },
      { description: "Hyperloop ticket found.", effectType: 'MOVE', value: 5 },
      { description: "Data leak! Pay hush money.", effectType: 'MONEY', value: -80 },
      { description: "Sold an NFT. Nice profit.", effectType: 'MONEY', value: 120 },
      { description: "Warp drive malfunction. Move back 3.", effectType: 'MOVE', value: -3 },
      { description: "Jetpack joyride. Move forward 4.", effectType: 'MOVE', value: 4 }
    ];

    return events[Math.floor(Math.random() * events.length)] as any;
};
