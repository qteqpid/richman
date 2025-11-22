
import React from 'react';
import { User, Smile, Zap, Crown, Skull, Rocket, Ghost, Gamepad2, Cpu, Bot } from 'lucide-react';
import { Tile, TileType, PASS_GO_MONEY } from '../types';

export const AVAILABLE_AVATARS = [
    { id: 'user', icon: <User size={20} /> },
    { id: 'smile', icon: <Smile size={20} /> },
    { id: 'zap', icon: <Zap size={20} /> },
    { id: 'crown', icon: <Crown size={20} /> },
    { id: 'skull', icon: <Skull size={20} /> },
    { id: 'rocket', icon: <Rocket size={20} /> },
    { id: 'ghost', icon: <Ghost size={20} /> },
    { id: 'gamepad', icon: <Gamepad2 size={20} /> },
];

export const getAvatarIcon = (avatar: string, size: number = 16) => {
    const props = { size };
    switch(avatar) {
        case 'user': return <User {...props} />;
        case 'cpu': return <Cpu {...props} />;
        case 'bot': return <Bot {...props} />;
        case 'smile': return <Smile {...props} />;
        case 'crown': return <Crown {...props} />;
        case 'skull': return <Skull {...props} />;
        case 'rocket': return <Rocket {...props} />;
        case 'ghost': return <Ghost {...props} />;
        case 'gamepad': return <Gamepad2 {...props} />;
        case 'zap': return <Zap {...props} />;
        default: return <User {...props} />;
    }
};

export const TILE_NAME_TRANSLATIONS: Record<string, string> = {
  "Start": "起点",
  "Book Store": "书店",
  "Bank": "银行",
  "Coffee Shop": "咖啡店",
  "Burger Joint": "汉堡店",
  "Income Tax": "所得税",
  "Subway": "地铁站",
  "Pet Shop": "宠物店",
  "Jail": "监狱",
  "Pharmacy": "药房",
  "School": "学校",
  "Library": "图书馆",
  "Fire Station": "消防站",
  "Hospital": "医院",
  "Bakery": "面包店",
  "Police Station": "警察局",
  "Free Parking": "免费停车场",
  "Toy Store": "玩具店",
  "Zoo": "动物园",
  "Chance": "机会",
  "Aquarium": "水族馆",
  "Cinema": "电影院",
  "Candy Shop": "糖果店",
  "Museum": "博物馆",
  "Go To Jail": "入狱",
  "Music Store": "音像店",
  "Shopping Mall": "购物中心",
  "Gym": "健身房",
  "Game Center": "游戏中心",
  "Theme Park": "主题公园",
  "Grand Hotel": "大酒店",
  "Airport": "机场",
  "Stock Exchange": "证券交易所",
  // Inner Loop Translations
  "Central Hub": "中央枢纽",
  "Tech Lab": "科技实验室",
  "Arcade": "街机厅",
  "Cyber Café": "网吧",
  "Clinic": "诊所",
  "Data Center": "数据中心",
  "Server Farm": "服务器农场",
  "ATM": "自动取款机",
  "VR Lounge": "VR 休息室",
  "Robot Repair": "机器人修理",
  "Drone Dock": "无人机码头",
  "Space Bar": "太空酒吧",
  "Luxury Pods": "豪华舱",
  "Orbital Shuttle": "轨道穿梭机"
};

export const getTileRules = (tile: Tile) => {
    const isGoToJail = tile.id === 24; 
    
    if (isGoToJail) {
        return {
            en: "ARREST: Go directly to Jail and pay a $100 fine.",
            cn: "逮捕：直接进监狱并支付 $100 罚款。"
        };
    }
    
    switch (tile.type) {
        case TileType.START:
            return {
                en: `Pass or land here to collect $${PASS_GO_MONEY}.`,
                cn: `经过或停留此处可领取 $${PASS_GO_MONEY} 奖金。`
            };
        case TileType.PROPERTY:
            return {
                en: `Price: $${tile.price}. Base Rent: $${tile.baseRent}. Buy this property to charge rent from opponents.`,
                cn: `价格: $${tile.price}。基础租金: $${tile.baseRent}。购买此地块可向停留的对手收取租金。`
            };
        case TileType.SHOPPING:
            return {
                en: "Shopping Mall. Spend a random amount (up to $100) if you land here.",
                cn: "购物中心。停留此处将随机花费（最高 $100）。"
            };
        case TileType.AIRPORT:
            return {
                en: "Airport. Fly to Central Hub. If you pass Central Hub in inner loop, you fly back here.",
                cn: "机场。飞往中央枢纽。如果你在内环经过中央枢纽，将飞回此处。"
            };
        case TileType.BANK:
            return {
                en: "Bank. Borrow money (5% interest) or repay debts.",
                cn: "银行。借款（5% 利息）或偿还债务。"
            };
        case TileType.STOCK_MARKET:
            return {
                en: "Stock Exchange. Buy or Sell stocks when passing or landing.",
                cn: "证券交易所。经过或停留时可买卖股票。"
            };
        case TileType.HOSPITAL:
            return {
                en: "Hospital/Clinic. Rest for 1 or 3 turns.",
                cn: "医院/诊所。休息 1 或 3 个回合。"
            };
        case TileType.JAIL:
            return {
                en: "Just visiting.",
                cn: "只是参观。"
            };
        case TileType.CHANCE:
            return {
                en: "Draw a Chance card.",
                cn: "抽取机会卡。"
            };
        case TileType.TAX:
            return {
                en: `Pay income tax ($${tile.price}).`,
                cn: `支付所得税 ($${tile.price})。`
            };
        case TileType.PARKING:
            return {
                en: "Free Parking. Nothing happens.",
                cn: "免费停车场。无事发生。"
            };
        default:
            return {
                en: "Standard block.",
                cn: "普通地块。"
            };
    }
};
