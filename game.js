(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const WORLD_W = 3600;
  const WORLD_H = 2400;
  const TILE = 80;
  const SAVE_KEY = "http-rtscs-2d-save-v1";

  const $ = (id) => document.getElementById(id);
  const canvas = $("world");
  const ctx = canvas.getContext("2d");
  const minimap = $("minimap");
  const miniCtx = minimap.getContext("2d");

  const ui = {
    topBar: $("topBar"),
    missionPanel: $("missionPanel"),
    sideCommands: $("sideCommands"),
    bottomHud: $("bottomHud"),
    groupBar: $("groupBar"),
    settingsBtn: $("settingsBtn"),
    settingsPanel: $("settingsPanel"),
    tooltip: $("tooltip"),
    mapMeta: $("mapMeta"),
    toastStack: $("toastStack"),
    startModal: $("startModal"),
    factionChoices: $("factionChoices"),
    startBtn: $("startGameBtn"),
    menuTitle: $("menuTitle"),
    menuSubtitle: $("menuSubtitle"),
    menuHeroText: $("menuHeroText"),
    menuHeroArt: $("menuHeroArt"),
    menuLevelSnapshot: $("menuLevelSnapshot"),
    menuHomeHint: $("menuHomeHint"),
    menuSettingsBtn: $("menuSettingsBtn"),
    menuLoadBtn: $("menuLoadBtn"),
    menuLevelEntryBtn: $("menuLevelEntryBtn"),
    menuGuideBtn: $("menuGuideBtn"),
    menuCodexBtn: $("menuCodexBtn"),
    menuExitBtn: $("menuExitBtn"),
    levelBackBtn: $("levelBackBtn"),
    levelStartBtn: $("levelStartBtn"),
    levelCardGrid: $("levelCardGrid"),
    menuLevelTitle: $("menuLevelTitle"),
    menuLevelMeta: $("menuLevelMeta")
  };

  const RES = {
    gold: { name: "黄金", short: "金", icon: "金", color: "#d9a348" },
    wood: { name: "木材", short: "木", icon: "木", color: "#9c6a36" },
    stone: { name: "石料", short: "石", icon: "石", color: "#bfc1bb" },
    metal: { name: "金属", short: "铁", icon: "铁", color: "#98a2a8" },
    jade: { name: "灵玉", short: "玉", icon: "玉", color: "#4cb383" },
    blood: { name: "妖血", short: "血", icon: "血", color: "#b94a43" },
    power: { name: "电力", short: "电", icon: "电", color: "#6eb8ff" },
    supply: { name: "人口", short: "人", icon: "人", color: "#d3b484" }
  };

  const FACTIONS = {
    huaxia: {
      name: "华夏",
      subtitle: "正规军制、科技解锁、兵种克制",
      color: "#2f70c5",
      accent: "#d9a348",
      terrain: "grass",
      lord: "主公",
      special: "主城升级、士兵升星、箭矢模式、军令"
    },
    jixie: {
      name: "机械",
      subtitle: "电力网络、模块改造、过载生产",
      color: "#58a9ff",
      accent: "#b7c2c8",
      terrain: "metal",
      lord: "指挥官",
      special: "电网、过载、改造槽、维修平台"
    },
    yaoshou: {
      name: "妖族",
      subtitle: "献祭建筑、吞噬成长、虫海巨兽",
      color: "#b94943",
      accent: "#69a84f",
      terrain: "dark",
      lord: "妖主",
      special: "吞噬、圣祭、腐肉回复、兽潮"
    },
    ziran: {
      name: "自然",
      subtitle: "五行克制、地形强化、元素融合",
      color: "#4e9b63",
      accent: "#58b9cc",
      terrain: "forest",
      lord: "灵主",
      special: "水火土金木、天象、融合、灵泉"
    },
    ronghe: {
      name: "融合",
      subtitle: "占领核心、定向路线、混合兵种",
      color: "#8f67c8",
      accent: "#d9a348",
      terrain: "ruin",
      lord: "摄政",
      special: "融合人口、路线专属、断供、混合技能"
    }
  };

  const TERRAIN = {
    grass: { color: "#536f3b", detail: "#7b8b4b" },
    forest: { color: "#2e5635", detail: "#4e7a44" },
    water: { color: "#2d6574", detail: "#5d9bad" },
    stone: { color: "#6d6b5b", detail: "#aaa284" },
    metal: { color: "#535e5e", detail: "#8b9b9d" },
    fire: { color: "#74392c", detail: "#d66a33" },
    dark: { color: "#42372b", detail: "#6d4a36" },
    ruin: { color: "#594d45", detail: "#8b7762" }
  };

  const ELEMENT_BEATS = {
    water: ["fire"],
    fire: ["wood", "metal"],
    earth: ["water", "charge"],
    metal: ["wood", "heavy", "building"],
    wood: ["earth", "slow"]
  };

  const BUILDINGS = {
    townCenter: {
      name: "主城",
      faction: "all",
      category: "核心",
      footprint: 4,
      hp: 5200,
      armor: 6,
      buildTime: 0,
      cost: {},
      supply: 24,
      canTrain: ["worker"],
      canResearch: ["conscription", "warOrder", "fortifyOrder", "heavenOrder"],
      abilities: ["townUpgrade", "rally"],
      desc: "阵营核心，提供建造范围、人口和全局命令。"
    },
    house: {
      name: "民房",
      faction: "huaxia",
      category: "人口",
      footprint: 2,
      hp: 650,
      armor: 1,
      buildTime: 18,
      cost: { gold: 80, wood: 100, stone: 20 },
      supply: 8,
      desc: "提高人口上限，三级后强化附近生产建筑。"
    },
    lumberCamp: {
      name: "伐木场",
      faction: "huaxia",
      category: "资源",
      footprint: 3,
      hp: 900,
      armor: 2,
      buildTime: 22,
      cost: { gold: 100, wood: 120, stone: 20 },
      income: { wood: 2.1 },
      abilities: ["focusWood"],
      desc: "提高木材采集效率。靠近森林时收益更高。"
    },
    quarry: {
      name: "采石场",
      faction: "huaxia",
      category: "资源",
      footprint: 3,
      hp: 1100,
      armor: 3,
      buildTime: 24,
      cost: { gold: 120, wood: 100, stone: 40 },
      income: { stone: 1.7 },
      abilities: ["stoneRepair"],
      desc: "提高石料采集，用于城防和主城升级。"
    },
    mint: {
      name: "铸币坊",
      faction: "huaxia",
      category: "资源",
      footprint: 3,
      hp: 1000,
      armor: 2,
      buildTime: 26,
      unlockTown: 2,
      cost: { gold: 280, wood: 180, stone: 160, metal: 60 },
      income: { gold: 2.2 },
      abilities: ["payBoost"],
      desc: "提高黄金产出，可开启军饷激励。"
    },
    ironworks: {
      name: "冶铁坊",
      faction: "huaxia",
      category: "资源",
      footprint: 3,
      hp: 1200,
      armor: 3,
      buildTime: 28,
      unlockTown: 2,
      cost: { gold: 260, wood: 200, stone: 120, metal: 80 },
      income: { metal: 1.5 },
      desc: "提高金属采集和高级军备生产效率。"
    },
    barracks: {
      name: "步兵营",
      faction: "huaxia",
      category: "军队",
      footprint: 4,
      hp: 1600,
      armor: 3,
      buildTime: 35,
      cost: { gold: 180, wood: 220, stone: 80 },
      canTrain: ["spearman", "archer", "warDog", "engineer", "shieldman", "antiAir", "crossbowElite", "guard"],
      abilities: ["rally"],
      desc: "生产全部步兵线单位。"
    },
    stable: {
      name: "骑兵营",
      faction: "huaxia",
      category: "军队",
      footprint: 4,
      hp: 1700,
      armor: 3,
      buildTime: 40,
      unlockTown: 2,
      requiresAny: ["dojo"],
      cost: { gold: 300, wood: 260, stone: 120, metal: 80 },
      canTrain: ["scoutCavalry", "lightCavalry", "raiderCavalry", "heavyCavalry", "blackCavalry"],
      abilities: ["rally"],
      desc: "生产骑兵，适合侦察、冲锋和切后排。"
    },
    skyCamp: {
      name: "飞羽营",
      faction: "huaxia",
      category: "军队",
      footprint: 4,
      hp: 1500,
      armor: 2,
      buildTime: 42,
      unlockTown: 2,
      requiresAny: ["dojo"],
      cost: { gold: 320, wood: 300, stone: 100, metal: 80 },
      canTrain: ["scoutHawk", "skyRider", "skyBolter", "armorHawk", "skyMarshal"],
      abilities: ["rally"],
      desc: "生产飞行单位，负责侦察、突袭和反空。"
    },
    dock: {
      name: "水师营",
      faction: "huaxia",
      category: "军队",
      footprint: 4,
      hp: 1800,
      armor: 4,
      buildTime: 45,
      unlockTown: 2,
      terrain: "waterEdge",
      cost: { gold: 300, wood: 360, stone: 80, metal: 80 },
      canTrain: ["lightBoat", "transportBoat", "boltBoat", "towerShip", "rocketBoat", "dragonShip"],
      abilities: ["rally"],
      desc: "生产水上单位，需要靠近水域。"
    },
    siegeWorkshop: {
      name: "工械坊",
      faction: "huaxia",
      category: "军队",
      footprint: 5,
      hp: 1900,
      armor: 4,
      buildTime: 50,
      unlockTown: 3,
      requiresAny: ["dojo"],
      cost: { gold: 520, wood: 420, stone: 260, metal: 180 },
      canTrain: ["ram", "catapult", "ladderCart", "pierceCart", "fireCart"],
      abilities: ["rally"],
      desc: "生产攻城器械。"
    },
    logistics: {
      name: "辎重营",
      faction: "huaxia",
      category: "军队",
      footprint: 4,
      hp: 1400,
      armor: 2,
      buildTime: 36,
      unlockTown: 2,
      cost: { gold: 260, wood: 260, stone: 100, metal: 40 },
      canTrain: ["supplyCart", "medic", "repairCart", "drumCart", "bannerCart"],
      desc: "生产后勤单位，提供补给、治疗和调度。"
    },
    dojo: {
      name: "演武台",
      faction: "huaxia",
      category: "科技",
      footprint: 4,
      hp: 1300,
      armor: 3,
      buildTime: 38,
      cost: { gold: 220, wood: 180, stone: 120, metal: 20 },
      canResearch: ["spearWall", "shieldWall", "dogTraining", "engineerDecree", "swiftMarch", "veteranDrill", "royalGuard", "strongBow", "antiAirDrill", "fireArrow", "poisonArrow", "slowArrow", "pierceArrow", "crossbowCraft", "chargeDrill", "siegeAim"],
      desc: "陆军、射击、骑兵和攻城科技。"
    },
    formationAltar: {
      name: "军阵坛",
      faction: "huaxia",
      category: "科技",
      footprint: 3,
      hp: 1300,
      armor: 4,
      buildTime: 35,
      unlockTown: 2,
      cost: { gold: 300, wood: 180, stone: 220, metal: 60 },
      canResearch: ["defenseFormation", "arrowFormation", "snakeFormation", "royalFormation"],
      abilities: ["formation"],
      desc: "研究和切换阵法光环。"
    },
    beacon: {
      name: "烽火台",
      faction: "huaxia",
      category: "科技",
      footprint: 2,
      hp: 950,
      armor: 3,
      buildTime: 28,
      unlockTown: 2,
      cost: { gold: 240, wood: 180, stone: 220, metal: 60 },
      canResearch: ["beaconWarn", "hawkBeacon"],
      abilities: ["scan"],
      desc: "提供视野、预警和区域侦察。"
    },
    skyTower: {
      name: "天机楼",
      faction: "huaxia",
      category: "科技",
      footprint: 4,
      hp: 1400,
      armor: 3,
      buildTime: 42,
      unlockTown: 2,
      requiresAny: ["skyCamp"],
      cost: { gold: 460, wood: 320, stone: 260, metal: 160 },
      canResearch: ["hawkEye", "skyRiderTraining", "airIntercept", "lowDive", "cloudMove", "armorHawkTech", "towerAntiAir", "skyMarshalCode"],
      abilities: ["airStrike"],
      desc: "空军科技、侦察和空中支援。"
    },
    navyOffice: {
      name: "水军府",
      faction: "huaxia",
      category: "科技",
      footprint: 4,
      hp: 1500,
      armor: 4,
      buildTime: 42,
      unlockTown: 2,
      requiresAny: ["dock"],
      terrain: "waterEdge",
      cost: { gold: 420, wood: 300, stone: 220, metal: 120 },
      canResearch: ["landingDrill", "boatBolter", "shipHull", "waveMove", "towerShipTech", "rocketNavy", "shoreCalibrate", "dragonNavy"],
      abilities: ["waterCannon"],
      desc: "水军科技、水域侦察和水面炮击。"
    },
    tower: {
      name: "箭塔",
      faction: "huaxia",
      category: "防御",
      footprint: 2,
      hp: 1200,
      armor: 4,
      buildTime: 32,
      cost: { gold: 140, wood: 160, stone: 180, metal: 30 },
      attack: { damage: [42, 55], range: 380, cooldown: 1.25, type: "arrow" },
      desc: "基础远程防御塔。"
    },
    wall: {
      name: "城墙",
      faction: "huaxia",
      category: "防御",
      footprint: 1,
      hp: 700,
      armor: 3,
      buildTime: 8,
      cost: { gold: 20, wood: 20, stone: 80 },
      blocks: true,
      desc: "阻挡敌人推进。"
    },
    gate: {
      name: "城门",
      faction: "huaxia",
      category: "防御",
      footprint: 2,
      hp: 1000,
      armor: 4,
      buildTime: 16,
      cost: { gold: 100, wood: 80, stone: 180, metal: 30 },
      abilities: ["toggleGate"],
      desc: "可开关通行的城防建筑。"
    },
    powerPlant: {
      name: "发电站",
      faction: "jixie",
      category: "资源",
      footprint: 3,
      hp: 1500,
      armor: 3,
      buildTime: 32,
      cost: { gold: 180, stone: 140, metal: 120 },
      powerGen: 80,
      desc: "机械阵营电力来源。"
    },
    pylon: {
      name: "高压电塔",
      faction: "jixie",
      category: "资源",
      footprint: 2,
      hp: 800,
      armor: 2,
      buildTime: 20,
      cost: { wood: 80, stone: 80, metal: 60 },
      powerRange: 420,
      desc: "拓展电网范围。"
    },
    factory: {
      name: "重装工厂",
      faction: "jixie",
      category: "军队",
      footprint: 5,
      hp: 2200,
      armor: 5,
      buildTime: 46,
      cost: { gold: 320, stone: 180, metal: 260 },
      powerUse: 32,
      canTrain: ["armorCar", "tank", "aaTruck", "engineTruck", "fortressCar"],
      abilities: ["overloadBuilding", "rally"],
      desc: "生产重型机械单位，缺电时队列降速。"
    },
    mechYard: {
      name: "机动机械场",
      faction: "jixie",
      category: "军队",
      footprint: 4,
      hp: 1700,
      armor: 4,
      buildTime: 38,
      cost: { gold: 260, wood: 80, metal: 180 },
      powerUse: 24,
      canTrain: ["machineWorker", "mechDog", "lightMech", "heavyMech", "gundam"],
      abilities: ["overloadBuilding", "rally"],
      desc: "生产机动机械和机甲。"
    },
    lab: {
      name: "科研中心",
      faction: "jixie",
      category: "科技",
      footprint: 4,
      hp: 1700,
      armor: 4,
      buildTime: 44,
      cost: { gold: 420, stone: 180, metal: 220 },
      powerUse: 28,
      canResearch: ["turboPower", "highVoltage", "energyOverload", "tankChassis", "aaMissile", "fireControlAI", "autoRepairAI", "moduleSlots", "railStrike"],
      desc: "研究能源、模块、AI和终局机械科技。"
    },
    modifyShop: {
      name: "改造车间",
      faction: "jixie",
      category: "科技",
      footprint: 4,
      hp: 1600,
      armor: 4,
      buildTime: 42,
      cost: { gold: 360, stone: 120, metal: 220 },
      powerUse: 30,
      abilities: ["modify"],
      desc: "给机械单位和建筑安装模块。"
    },
    mechTurret: {
      name: "防御炮台",
      faction: "jixie",
      category: "防御",
      footprint: 2,
      hp: 1400,
      armor: 5,
      buildTime: 30,
      cost: { gold: 160, stone: 220, metal: 140 },
      powerUse: 18,
      attack: { damage: [44, 60], range: 420, cooldown: 1, type: "bullet" },
      desc: "模块化防御塔，可受电力和过载影响。"
    },
    beastNest: {
      name: "虫巢",
      faction: "yaoshou",
      category: "军队",
      footprint: 4,
      hp: 1800,
      armor: 3,
      buildTime: 34,
      cost: { gold: 160, wood: 240, stone: 60 },
      canTrain: ["meatBug", "burstBug", "stingerBug", "motherBug"],
      abilities: ["sacrifice"],
      desc: "生产虫类，适合虫海、自爆和潜伏。"
    },
    beastDen: {
      name: "凶兽巢",
      faction: "yaoshou",
      category: "军队",
      footprint: 4,
      hp: 2100,
      armor: 4,
      buildTime: 42,
      cost: { gold: 260, wood: 220, stone: 120, metal: 80 },
      canTrain: ["tigerBeast", "taotie", "mammothBeast", "shadowWolf"],
      abilities: ["sacrifice"],
      desc: "生产重装、猛攻和迅捷妖兽。"
    },
    bloodPool: {
      name: "妖血池",
      faction: "yaoshou",
      category: "科技",
      footprint: 3,
      hp: 1500,
      armor: 2,
      buildTime: 36,
      cost: { gold: 260, wood: 180, stone: 120 },
      canResearch: ["devourBoost", "bloodStorage", "bloodRage", "toxicGland", "boneArmor", "beastTide"],
      income: { blood: 0.9 },
      desc: "吞噬科技和妖血成长。"
    },
    boneTower: {
      name: "骨刺妖塔",
      faction: "yaoshou",
      category: "防御",
      footprint: 2,
      hp: 1300,
      armor: 4,
      buildTime: 30,
      cost: { gold: 130, wood: 130, stone: 200 },
      attack: { damage: [38, 52], range: 360, cooldown: 0.9, type: "poison" },
      desc: "可演化为毒刺、爆裂、猎空或穿甲防御。"
    },
    waterPool: {
      name: "水灵源池",
      faction: "ziran",
      category: "军队",
      footprint: 3,
      hp: 2600,
      armor: 2,
      buildTime: 45,
      terrain: "waterEdge",
      cost: { gold: 220, wood: 180, stone: 80 },
      canTrain: ["waterSprite", "rainCaller", "iceBlade", "tideGiant"],
      desc: "只生产水系单位，水面上获得强化。"
    },
    fireForge: {
      name: "炽火灵炉",
      faction: "ziran",
      category: "军队",
      footprint: 3,
      hp: 2500,
      armor: 2,
      buildTime: 45,
      cost: { gold: 220, wood: 220, stone: 60, metal: 40 },
      canTrain: ["fireSprite", "emberThrower", "flameGiant"],
      desc: "只生产火系单位，擅长范围燃烧。"
    },
    earthAltar: {
      name: "厚土灵坛",
      faction: "ziran",
      category: "军队",
      footprint: 3,
      hp: 3400,
      armor: 5,
      buildTime: 55,
      cost: { gold: 220, wood: 180, stone: 220 },
      canTrain: ["earthGuard", "stoneTurtle", "mountainGiant"],
      desc: "只生产土系单位，擅长正面防御。"
    },
    metalCourt: {
      name: "金魄铸庭",
      faction: "ziran",
      category: "军队",
      footprint: 3,
      hp: 2800,
      armor: 4,
      buildTime: 55,
      cost: { gold: 260, wood: 160, stone: 120, metal: 160 },
      canTrain: ["metalFencer", "bladeArcher", "goldGuard"],
      desc: "只生产金系单位，擅长穿甲和命中。"
    },
    woodGarden: {
      name: "灵木育场",
      faction: "ziran",
      category: "军队",
      footprint: 3,
      hp: 3000,
      armor: 3,
      buildTime: 50,
      cost: { gold: 180, wood: 300, stone: 80 },
      canTrain: ["woodHealer", "rootGuard", "treeElder"],
      desc: "只生产木系单位，擅长回复和控制。"
    },
    fusionAltar: {
      name: "元素融合坛",
      faction: "ziran",
      category: "科技",
      footprint: 4,
      hp: 3600,
      armor: 4,
      buildTime: 65,
      cost: { gold: 360, wood: 260, stone: 180, metal: 80 },
      canResearch: ["elementResonance", "dualFusion", "fusionStable", "weatherCycle"],
      abilities: ["fusion"],
      desc: "将两个元素单位融合为新单位。"
    },
    springRing: {
      name: "灵泉之环",
      faction: "ziran",
      category: "科技",
      footprint: 3,
      hp: 2400,
      armor: 2,
      buildTime: 45,
      cost: { gold: 220, wood: 180, stone: 120 },
      abilities: ["healAura", "cleanse"],
      desc: "治疗、回复和净化负面状态。"
    },
    rootTower: {
      name: "根须守卫",
      faction: "ziran",
      category: "防御",
      footprint: 2,
      hp: 1900,
      armor: 4,
      buildTime: 35,
      cost: { gold: 120, wood: 160, stone: 180 },
      attack: { damage: [32, 46], range: 340, cooldown: 0.95, type: "wood" },
      desc: "自然防御，可根据元素科技切换模式。"
    },
    fusionCore: {
      name: "占领核心",
      faction: "ronghe",
      category: "核心",
      footprint: 4,
      hp: 5000,
      armor: 6,
      buildTime: 0,
      cost: {},
      supply: 20,
      canTrain: ["worker", "musket", "arrayBot", "fiveElementSoldier", "mechBug"],
      canResearch: ["fusionExpand", "fusionSupply", "supplyLink", "hybridDrill"],
      abilities: ["route"],
      desc: "占领主城后出现的融合核心，限制融合建筑和融合人口。"
    },
    hybridStable: {
      name: "融合军营",
      faction: "ronghe",
      category: "军队",
      footprint: 4,
      hp: 2800,
      armor: 4,
      buildTime: 48,
      cost: { gold: 360, wood: 220, stone: 140, metal: 120 },
      canTrain: ["beastCavalry", "musket", "arrayBot", "spiritMech", "woodTiger"],
      desc: "生产定向融合路线单位。"
    },
    hybridLab: {
      name: "融合兵法阁",
      faction: "ronghe",
      category: "科技",
      footprint: 4,
      hp: 2600,
      armor: 3,
      buildTime: 58,
      cost: { gold: 420, wood: 220, stone: 180, metal: 120 },
      canResearch: ["fusionExpand", "fusionSupply", "hybridDrill", "routeMastery", "supplyLink"],
      desc: "研究融合人口、路线专属和断供保护。"
    },
    hybridTower: {
      name: "镇妖锁塔",
      faction: "ronghe",
      category: "防御",
      footprint: 2,
      hp: 2400,
      armor: 5,
      buildTime: 45,
      cost: { gold: 220, wood: 180, stone: 280, metal: 120 },
      attack: { damage: [46, 64], range: 380, cooldown: 1.05, type: "seal" },
      desc: "融合路线防御，减速大型单位。"
    }
  };

  const UNITS = {
    worker: {
      name: "工兵",
      faction: "all",
      role: "建造 / 采集",
      hp: 240,
      damage: [6, 10],
      attackSpeed: 0.8,
      range: 44,
      armor: 0,
      speed: 130,
      sight: 430,
      supply: 1,
      trainTime: 12,
      cost: { gold: 60, wood: 20 },
      tags: ["worker", "light"],
      abilities: ["build", "repair"],
      desc: "基础采集和建造单位。"
    },
    spearman: {
      name: "枪兵",
      faction: "huaxia",
      role: "反骑兵 / 反大型",
      hp: 420,
      damage: [22, 28],
      attackSpeed: 1,
      range: 64,
      armor: 2,
      speed: 124,
      sight: 420,
      supply: 1,
      trainTime: 16,
      cost: { gold: 80, wood: 30, metal: 10 },
      tags: ["infantry", "medium", "antiCavalry"],
      abilities: ["spearWall"],
      counters: ["cavalry", "large", "charge"],
      weak: ["archer", "siege", "fire"],
      desc: "停止移动后可进入枪阵，对冲锋单位有强克制。"
    },
    archer: {
      name: "弓手",
      faction: "huaxia",
      role: "基础远程输出",
      hp: 300,
      damage: [18, 24],
      attackSpeed: 1.1,
      range: 300,
      armor: 0,
      speed: 120,
      sight: 460,
      supply: 1,
      trainTime: 18,
      cost: { gold: 90, wood: 60 },
      tags: ["infantry", "light", "archer"],
      abilities: ["arrowMode", "volley"],
      counters: ["light", "worker", "flying"],
      weak: ["cavalry", "shield"],
      desc: "可通过科技切换火箭、毒箭、缓速和穿甲箭。"
    },
    warDog: {
      name: "军犬",
      faction: "huaxia",
      role: "反工程师 / 侦察",
      hp: 180,
      damage: [18, 24],
      attackSpeed: 1.4,
      range: 42,
      armor: 0,
      speed: 192,
      sight: 460,
      supply: 1,
      trainTime: 12,
      cost: { gold: 70 },
      unlockTech: "dogTraining",
      tags: ["beast", "light", "scout"],
      abilities: ["sniff"],
      counters: ["worker", "engineer", "scout"],
      weak: ["cavalry", "tower", "aoe"],
      desc: "高速侦察，可发现隐蔽单位。"
    },
    engineer: {
      name: "工程师",
      faction: "huaxia",
      role: "占领 / 修复",
      hp: 220,
      damage: [0, 0],
      attackSpeed: 0,
      range: 0,
      armor: 0,
      speed: 128,
      sight: 420,
      supply: 1,
      trainTime: 25,
      cost: { gold: 180, wood: 80 },
      unlockTech: "engineerDecree",
      tags: ["worker", "engineer", "light"],
      abilities: ["capture", "repair"],
      desc: "可占领中立建筑和部分敌方建筑。"
    },
    shieldman: {
      name: "刀盾兵",
      faction: "huaxia",
      role: "抗远程 / 推进",
      hp: 620,
      damage: [20, 26],
      attackSpeed: 0.9,
      range: 48,
      armor: 5,
      speed: 108,
      sight: 420,
      supply: 2,
      trainTime: 24,
      cost: { gold: 120, wood: 40, metal: 50 },
      unlockTech: "shieldWall",
      tags: ["infantry", "heavy", "shield"],
      abilities: ["shieldAdvance"],
      counters: ["archer", "ranged"],
      weak: ["charge", "pierce", "fire", "siege"],
      desc: "举盾推进时降低远程伤害。"
    },
    antiAir: {
      name: "防空弩兵",
      faction: "huaxia",
      role: "专门防空",
      hp: 360,
      damage: [24, 32],
      attackSpeed: 0.9,
      range: 325,
      armor: 1,
      speed: 112,
      sight: 460,
      supply: 2,
      trainTime: 26,
      cost: { gold: 140, wood: 70, metal: 60 },
      unlockTech: "antiAirDrill",
      tags: ["infantry", "light", "archer", "antiAir"],
      abilities: ["arrowMode"],
      counters: ["flying"],
      weak: ["cavalry", "siege", "archer"],
      desc: "对飞行单位有额外命中和伤害。"
    },
    crossbowElite: {
      name: "神臂弩手",
      faction: "huaxia",
      role: "破甲 / 反重甲",
      hp: 380,
      damage: [58, 76],
      attackSpeed: 0.55,
      range: 375,
      armor: 1,
      speed: 100,
      sight: 460,
      supply: 3,
      trainTime: 38,
      cost: { gold: 220, wood: 100, metal: 120 },
      unlockTech: "crossbowCraft",
      tags: ["infantry", "light", "archer", "pierce"],
      abilities: ["arrowMode", "armorBreak"],
      counters: ["heavy", "hero", "cavalry"],
      weak: ["cavalry", "flying", "beast"],
      desc: "高伤破甲弩，攻击重甲时表现突出。"
    },
    guard: {
      name: "羽林卫",
      faction: "huaxia",
      role: "精锐步兵 / 护卫",
      hp: 820,
      damage: [38, 50],
      attackSpeed: 0.95,
      range: 52,
      armor: 7,
      speed: 112,
      sight: 420,
      supply: 3,
      trainTime: 36,
      cost: { gold: 260, wood: 60, metal: 140 },
      unlockTech: "royalGuard",
      tags: ["infantry", "heavy", "elite"],
      abilities: ["guardAura"],
      counters: ["infantry", "heroSupport"],
      weak: ["pierce", "fire", "siege"],
      desc: "英雄附近护甲提高。"
    },
    scoutCavalry: {
      name: "斥候骑",
      faction: "huaxia",
      role: "陆地侦察",
      hp: 360,
      damage: [18, 24],
      attackSpeed: 1,
      range: 50,
      armor: 1,
      speed: 212,
      sight: 620,
      supply: 2,
      trainTime: 20,
      cost: { gold: 120, wood: 30, metal: 20 },
      tags: ["cavalry", "scout", "medium"],
      abilities: ["withdraw"],
      counters: ["worker", "engineer", "scout"],
      weak: ["antiCavalry", "tower"],
      desc: "快速侦察和骚扰。"
    },
    lightCavalry: {
      name: "轻骑兵",
      faction: "huaxia",
      role: "切后排 / 切远程",
      hp: 520,
      damage: [34, 44],
      attackSpeed: 1,
      range: 52,
      armor: 3,
      speed: 192,
      sight: 460,
      supply: 2,
      trainTime: 28,
      cost: { gold: 180, wood: 50, metal: 50 },
      tags: ["cavalry", "charge", "medium"],
      abilities: ["charge", "withdraw"],
      counters: ["ranged", "support", "siege"],
      weak: ["antiCavalry", "tower", "heavy"],
      desc: "高速突袭远程和后勤。"
    },
    raiderCavalry: {
      name: "游击骑",
      faction: "huaxia",
      role: "骑射 / 骚扰",
      hp: 460,
      damage: [24, 32],
      attackSpeed: 1,
      range: 225,
      armor: 2,
      speed: 188,
      sight: 500,
      supply: 2,
      trainTime: 30,
      cost: { gold: 220, wood: 80, metal: 60 },
      unlockTech: "raiderTactics",
      tags: ["cavalry", "ranged", "medium"],
      abilities: ["kiteShot"],
      counters: ["slow", "support", "resourceLine"],
      weak: ["antiAir", "archer", "lightCavalry"],
      desc: "机动骑射，适合资源线骚扰。"
    },
    heavyCavalry: {
      name: "重骑兵",
      faction: "huaxia",
      role: "冲阵 / 突破",
      hp: 920,
      damage: [58, 76],
      attackSpeed: 0.8,
      range: 54,
      armor: 6,
      speed: 152,
      sight: 460,
      supply: 4,
      trainTime: 42,
      cost: { gold: 320, wood: 80, metal: 160 },
      unlockTech: "heavyCavalry",
      tags: ["cavalry", "heavy", "charge"],
      abilities: ["charge"],
      counters: ["infantry", "archer", "support"],
      weak: ["antiCavalry", "pierce", "slow"],
      desc: "正面冲锋突破单位。"
    },
    blackCavalry: {
      name: "玄甲重骑",
      faction: "huaxia",
      role: "昂贵重骑 / 压制",
      hp: 1450,
      damage: [85, 110],
      attackSpeed: 0.7,
      range: 58,
      armor: 10,
      speed: 128,
      sight: 460,
      supply: 5,
      trainTime: 58,
      cost: { gold: 520, wood: 120, metal: 300 },
      unlockTech: "blackCavalry",
      tags: ["cavalry", "heavy", "elite", "charge"],
      abilities: ["breakCharge"],
      counters: ["infantry", "light"],
      weak: ["antiCavalry", "pierce", "siege"],
      desc: "终局重骑，冲锋命中越多护盾越高。"
    },
    scoutHawk: {
      name: "斥候鹰",
      faction: "huaxia",
      role: "空中侦察",
      hp: 180,
      damage: [8, 12],
      attackSpeed: 0.8,
      range: 175,
      armor: 0,
      speed: 232,
      sight: 720,
      supply: 1,
      trainTime: 18,
      cost: { gold: 100, wood: 40 },
      tags: ["flying", "scout", "light"],
      abilities: ["mark"],
      counters: ["scout"],
      weak: ["antiAir", "tower"],
      desc: "超大视野，可标记敌人。"
    },
    skyRider: {
      name: "飞羽骑",
      faction: "huaxia",
      role: "空中反地",
      hp: 360,
      damage: [26, 34],
      attackSpeed: 0.9,
      range: 225,
      armor: 1,
      speed: 192,
      sight: 560,
      supply: 2,
      trainTime: 30,
      cost: { gold: 220, wood: 100, metal: 60 },
      unlockTech: "skyRiderTraining",
      tags: ["flying", "ranged"],
      abilities: ["dive"],
      counters: ["backline", "siege", "support"],
      weak: ["antiAir", "tower"],
      desc: "飞行突袭单位，切后排。"
    },
    skyBolter: {
      name: "防空鹰弩",
      faction: "huaxia",
      role: "空中反空",
      hp: 400,
      damage: [28, 38],
      attackSpeed: 1,
      range: 275,
      armor: 1,
      speed: 180,
      sight: 560,
      supply: 3,
      trainTime: 34,
      cost: { gold: 260, wood: 120, metal: 100 },
      unlockTech: "airIntercept",
      tags: ["flying", "antiAir"],
      abilities: ["intercept"],
      counters: ["flying"],
      weak: ["antiAir", "tower"],
      desc: "专职空中截击。"
    },
    armorHawk: {
      name: "破甲鹰弩",
      faction: "huaxia",
      role: "空中破甲",
      hp: 420,
      damage: [48, 65],
      attackSpeed: 0.65,
      range: 325,
      armor: 1,
      speed: 168,
      sight: 560,
      supply: 3,
      trainTime: 42,
      cost: { gold: 340, wood: 140, metal: 160 },
      unlockTech: "armorHawkTech",
      tags: ["flying", "pierce"],
      abilities: ["armorBreak"],
      counters: ["heavy", "ship", "hero"],
      weak: ["antiAir", "tower"],
      desc: "对重甲和船只造成破甲压力。"
    },
    skyMarshal: {
      name: "天羽都尉",
      faction: "huaxia",
      role: "空军指挥",
      hp: 780,
      damage: [58, 76],
      attackSpeed: 0.8,
      range: 275,
      armor: 3,
      speed: 180,
      sight: 620,
      supply: 5,
      trainTime: 60,
      cost: { gold: 600, wood: 220, metal: 260 },
      unlockTech: "skyMarshalCode",
      tags: ["flying", "elite", "support"],
      abilities: ["airCommand"],
      counters: ["flyingGroup"],
      weak: ["antiAir"],
      desc: "空军精锐光环单位。"
    },
    lightBoat: {
      name: "轻舟",
      faction: "huaxia",
      role: "水面侦察",
      hp: 520,
      damage: [28, 36],
      attackSpeed: 0.9,
      range: 250,
      armor: 1,
      speed: 168,
      sight: 520,
      supply: 2,
      trainTime: 26,
      cost: { gold: 120, wood: 120, metal: 20 },
      tags: ["ship", "light"],
      waterOnly: true,
      abilities: ["waveMove"],
      counters: ["transport", "scout"],
      weak: ["ship", "shore"],
      desc: "轻型战船，适合侦察和骚扰。"
    },
    transportBoat: {
      name: "运兵舟",
      faction: "huaxia",
      role: "运输登陆",
      hp: 760,
      damage: [0, 0],
      attackSpeed: 0,
      range: 0,
      armor: 2,
      speed: 140,
      sight: 460,
      supply: 2,
      trainTime: 32,
      cost: { gold: 160, wood: 180, metal: 30 },
      tags: ["ship", "transport"],
      waterOnly: true,
      abilities: ["load", "unload"],
      desc: "运输地面单位登陆。"
    },
    boltBoat: {
      name: "弩舟",
      faction: "huaxia",
      role: "水上远程",
      hp: 640,
      damage: [42, 58],
      attackSpeed: 0.8,
      range: 350,
      armor: 1,
      speed: 136,
      sight: 520,
      supply: 3,
      trainTime: 38,
      cost: { gold: 240, wood: 220, metal: 80 },
      unlockTech: "boatBolter",
      tags: ["ship", "ranged"],
      waterOnly: true,
      abilities: ["shoreShot"],
      counters: ["lightShip", "shoreLight"],
      weak: ["heavyShip", "flying"],
      desc: "可攻击岸边单位。"
    },
    towerShip: {
      name: "楼船",
      faction: "huaxia",
      role: "水上主力",
      hp: 1600,
      damage: [90, 125],
      attackSpeed: 0.55,
      range: 400,
      armor: 5,
      speed: 100,
      sight: 560,
      supply: 5,
      trainTime: 60,
      cost: { gold: 520, wood: 420, metal: 220 },
      unlockTech: "towerShipTech",
      tags: ["ship", "heavy", "aoe"],
      waterOnly: true,
      abilities: ["waterFortress"],
      counters: ["ship", "shore"],
      weak: ["rocket", "pierce", "flying"],
      desc: "静止后获得水上堡垒效果。"
    },
    rocketBoat: {
      name: "火箭舟",
      faction: "huaxia",
      role: "岸边轰击 / 反建筑",
      hp: 900,
      damage: [120, 160],
      attackSpeed: 0.45,
      range: 425,
      armor: 2,
      speed: 112,
      sight: 560,
      supply: 4,
      trainTime: 54,
      cost: { gold: 480, wood: 360, metal: 180 },
      unlockTech: "rocketNavy",
      tags: ["ship", "rocket", "siege"],
      waterOnly: true,
      abilities: ["burnShore"],
      counters: ["building", "heavyShip", "cluster"],
      weak: ["lightShip", "flying", "pierce"],
      desc: "对建筑和密集单位强。"
    },
    dragonShip: {
      name: "龙舟旗舰",
      faction: "huaxia",
      role: "水军指挥",
      hp: 2200,
      damage: [110, 145],
      attackSpeed: 0.6,
      range: 400,
      armor: 6,
      speed: 104,
      sight: 620,
      supply: 6,
      trainTime: 80,
      cost: { gold: 900, wood: 600, metal: 360 },
      unlockTech: "dragonNavy",
      tags: ["ship", "elite", "support"],
      waterOnly: true,
      abilities: ["navyCommand"],
      counters: ["shipGroup"],
      weak: ["rocket", "pierce", "shore"],
      desc: "水军终局光环。"
    },
    ram: {
      name: "冲车",
      faction: "huaxia",
      role: "近战拆建筑",
      hp: 900,
      damage: [160, 220],
      attackSpeed: 0.35,
      range: 56,
      armor: 5,
      speed: 84,
      sight: 360,
      supply: 3,
      trainTime: 36,
      cost: { gold: 220, wood: 220, stone: 60, metal: 40 },
      tags: ["siege", "mechanical"],
      abilities: ["siege"],
      counters: ["building", "wall"],
      weak: ["cavalry", "flying", "fire"],
      desc: "贴近建筑造成巨额攻城伤害。"
    },
    catapult: {
      name: "投石车",
      faction: "huaxia",
      role: "远程范围攻城",
      hp: 700,
      damage: [140, 190],
      attackSpeed: 0.25,
      range: 500,
      armor: 2,
      speed: 72,
      sight: 460,
      supply: 4,
      trainTime: 52,
      cost: { gold: 360, wood: 320, stone: 120, metal: 80 },
      unlockTech: "catapultTech",
      tags: ["siege", "aoe", "mechanical"],
      abilities: ["deploy"],
      counters: ["building", "cluster", "tower"],
      weak: ["cavalry", "flying", "fast"],
      desc: "远程抛石，克制建筑和密集步兵。"
    },
    ladderCart: {
      name: "云梯车",
      faction: "huaxia",
      role: "越墙 / 突破",
      hp: 800,
      damage: [0, 0],
      attackSpeed: 0,
      range: 0,
      armor: 3,
      speed: 80,
      sight: 360,
      supply: 3,
      trainTime: 40,
      cost: { gold: 260, wood: 280, stone: 80, metal: 40 },
      unlockTech: "ladderTech",
      tags: ["siege", "support", "mechanical"],
      abilities: ["scaleWall"],
      counters: ["wall"],
      weak: ["fire", "cavalry", "flying"],
      desc: "突破城墙封锁。"
    },
    pierceCart: {
      name: "神机弩车",
      faction: "huaxia",
      role: "直线穿透 / 反建筑",
      hp: 850,
      damage: [120, 160],
      attackSpeed: 0.45,
      range: 425,
      armor: 3,
      speed: 76,
      sight: 460,
      supply: 5,
      trainTime: 60,
      cost: { gold: 560, wood: 420, stone: 120, metal: 240 },
      unlockTech: "pierceCartTech",
      tags: ["siege", "pierce", "mechanical"],
      abilities: ["linePierce"],
      counters: ["heavy", "building", "line"],
      weak: ["cavalry", "flying", "rocket"],
      desc: "高穿透弩车。"
    },
    fireCart: {
      name: "火油车",
      faction: "huaxia",
      role: "范围燃烧",
      hp: 760,
      damage: [90, 120],
      attackSpeed: 0.35,
      range: 375,
      armor: 2,
      speed: 72,
      sight: 420,
      supply: 4,
      trainTime: 56,
      cost: { gold: 480, wood: 300, stone: 80, metal: 100 },
      unlockTech: "fireCartTech",
      tags: ["siege", "fire", "aoe", "mechanical"],
      abilities: ["burnArea"],
      counters: ["cluster", "building", "wood"],
      weak: ["fast", "pierce"],
      desc: "留下燃烧区域，反密集。"
    },
    supplyCart: {
      name: "辎重车",
      faction: "huaxia",
      role: "脱战恢复 / 补给",
      hp: 520,
      damage: [0, 0],
      attackSpeed: 0,
      range: 0,
      armor: 1,
      speed: 112,
      sight: 420,
      supply: 2,
      trainTime: 28,
      cost: { gold: 180, wood: 120, metal: 20 },
      tags: ["support", "mechanical"],
      abilities: ["supplyAura"],
      desc: "给附近友军提供脱战恢复。"
    },
    medic: {
      name: "医官队",
      faction: "huaxia",
      role: "治疗步兵",
      hp: 360,
      damage: [0, 0],
      attackSpeed: 0,
      range: 0,
      armor: 0,
      speed: 120,
      sight: 420,
      supply: 2,
      trainTime: 30,
      cost: { gold: 220, wood: 40 },
      unlockTech: "medicSystem",
      tags: ["support", "light"],
      abilities: ["heal"],
      desc: "治疗步兵，提升持久作战能力。"
    },
    repairCart: {
      name: "修理车",
      faction: "huaxia",
      role: "修理器械 / 建筑",
      hp: 500,
      damage: [0, 0],
      attackSpeed: 0,
      range: 0,
      armor: 1,
      speed: 108,
      sight: 420,
      supply: 2,
      trainTime: 34,
      cost: { gold: 260, wood: 100, metal: 80 },
      unlockTech: "repairSystem",
      tags: ["support", "mechanical"],
      abilities: ["repair"],
      desc: "修理建筑、船只和攻城器械。"
    },
    drumCart: {
      name: "鼓舞车",
      faction: "huaxia",
      role: "经验 / 攻速光环",
      hp: 460,
      damage: [0, 0],
      attackSpeed: 0,
      range: 0,
      armor: 1,
      speed: 108,
      sight: 420,
      supply: 2,
      trainTime: 36,
      cost: { gold: 300, wood: 160, metal: 40 },
      unlockTech: "drumCommand",
      tags: ["support", "mechanical"],
      abilities: ["inspire"],
      desc: "提高附近单位经验和攻速。"
    },
    bannerCart: {
      name: "旗令车",
      faction: "huaxia",
      role: "集结 / 机动调度",
      hp: 620,
      damage: [0, 0],
      attackSpeed: 0,
      range: 0,
      armor: 2,
      speed: 116,
      sight: 460,
      supply: 3,
      trainTime: 44,
      cost: { gold: 420, wood: 180, metal: 120 },
      unlockTech: "bannerCommand",
      tags: ["support", "mechanical"],
      abilities: ["temporaryRally"],
      desc: "创建临时集结点并提升调度。"
    },
    machineWorker: {
      name: "机器工人",
      faction: "jixie",
      role: "建造 / 维修 / 采集",
      hp: 320,
      damage: [10, 15],
      attackSpeed: 0.8,
      range: 44,
      armor: 2,
      speed: 132,
      sight: 440,
      supply: 1,
      trainTime: 13,
      cost: { gold: 70, metal: 30 },
      tags: ["worker", "mechanical"],
      abilities: ["build", "repair"],
      desc: "机械基础工人，可修理和拖拽残骸。"
    },
    mechDog: {
      name: "机械狗",
      faction: "jixie",
      role: "侦察 / 反轻甲",
      hp: 260,
      damage: [22, 30],
      attackSpeed: 1.25,
      range: 46,
      armor: 2,
      speed: 196,
      sight: 560,
      supply: 1,
      trainTime: 16,
      cost: { gold: 95, metal: 45 },
      tags: ["mechanical", "scout", "light"],
      abilities: ["overloadUnit", "sniffRadar"],
      counters: ["worker", "light", "stealth"],
      weak: ["tank", "aoe", "tower"],
      desc: "机械侦察单位，可过载加速。"
    },
    lightMech: {
      name: "轻型动力机甲",
      faction: "jixie",
      role: "通用战斗",
      hp: 680,
      damage: [46, 62],
      attackSpeed: 0.95,
      range: 210,
      armor: 4,
      speed: 136,
      sight: 480,
      supply: 3,
      trainTime: 30,
      cost: { gold: 210, metal: 140 },
      tags: ["mechanical", "medium", "ranged"],
      abilities: ["overloadUnit", "modify"],
      counters: ["infantry", "beast"],
      weak: ["antiArmor", "emp"],
      desc: "可安装模块形成不同路线。"
    },
    heavyMech: {
      name: "重装动力机甲",
      faction: "jixie",
      role: "近战 / 火力强化",
      hp: 1150,
      damage: [72, 92],
      attackSpeed: 0.75,
      range: 70,
      armor: 7,
      speed: 106,
      sight: 460,
      supply: 5,
      trainTime: 46,
      cost: { gold: 360, metal: 260, stone: 80 },
      unlockTech: "moduleSlots",
      tags: ["mechanical", "heavy", "mech"],
      abilities: ["overloadUnit", "jumpJet", "modify"],
      counters: ["infantry", "building"],
      weak: ["emp", "flying", "pierce"],
      desc: "重型机甲，可跳跃切入。"
    },
    gundam: {
      name: "高达型机甲",
      faction: "jixie",
      role: "精英机械",
      hp: 2600,
      damage: [118, 150],
      attackSpeed: 0.65,
      range: 270,
      armor: 11,
      speed: 88,
      sight: 560,
      supply: 10,
      trainTime: 82,
      cost: { gold: 900, metal: 620, stone: 220 },
      unlockTech: "railStrike",
      tags: ["mechanical", "heavy", "elite"],
      abilities: ["overloadUnit", "railCannon"],
      counters: ["heavy", "building", "hero"],
      weak: ["emp", "airStrike", "focus"],
      desc: "后期精英机甲。"
    },
    armorCar: {
      name: "轻型装甲车",
      faction: "jixie",
      role: "反步兵 / 侦察",
      hp: 760,
      damage: [40, 56],
      attackSpeed: 1.1,
      range: 230,
      armor: 5,
      speed: 166,
      sight: 520,
      supply: 3,
      trainTime: 28,
      cost: { gold: 190, metal: 150 },
      tags: ["mechanical", "vehicle", "medium"],
      abilities: ["overloadUnit"],
      counters: ["infantry", "worker", "beast"],
      weak: ["tank", "antiArmor"],
      desc: "高速装甲火力。"
    },
    tank: {
      name: "主战坦克",
      faction: "jixie",
      role: "反装甲 / 建筑",
      hp: 1250,
      damage: [88, 118],
      attackSpeed: 0.55,
      range: 330,
      armor: 8,
      speed: 96,
      sight: 540,
      supply: 5,
      trainTime: 48,
      cost: { gold: 360, metal: 300, stone: 80 },
      unlockTech: "tankChassis",
      tags: ["mechanical", "vehicle", "heavy"],
      abilities: ["overloadUnit", "armorPierce"],
      counters: ["armor", "building"],
      weak: ["flying", "antiTank", "swarm"],
      desc: "机械主力坦克。"
    },
    aaTruck: {
      name: "防空导弹车",
      faction: "jixie",
      role: "反飞行",
      hp: 780,
      damage: [64, 92],
      attackSpeed: 0.7,
      range: 390,
      armor: 4,
      speed: 112,
      sight: 600,
      supply: 4,
      trainTime: 40,
      cost: { gold: 310, metal: 240 },
      unlockTech: "aaMissile",
      tags: ["mechanical", "vehicle", "antiAir"],
      abilities: ["lockOn"],
      counters: ["flying"],
      weak: ["tank", "fastMelee"],
      desc: "锁定飞行目标。"
    },
    engineTruck: {
      name: "重型工程采集车",
      faction: "jixie",
      role: "高耐久采集 / 修理",
      hp: 980,
      damage: [20, 28],
      attackSpeed: 0.8,
      range: 48,
      armor: 6,
      speed: 92,
      sight: 460,
      supply: 4,
      trainTime: 42,
      cost: { gold: 280, metal: 220, stone: 120 },
      unlockTech: "autoRepairAI",
      tags: ["worker", "mechanical", "heavy"],
      abilities: ["repair", "salvage"],
      desc: "前线修理和残骸回收。"
    },
    fortressCar: {
      name: "机械堡垒车",
      faction: "jixie",
      role: "移动防线",
      hp: 2300,
      damage: [84, 120],
      attackSpeed: 0.6,
      range: 350,
      armor: 12,
      speed: 64,
      sight: 540,
      supply: 8,
      trainTime: 72,
      cost: { gold: 720, metal: 520, stone: 260 },
      unlockTech: "railStrike",
      tags: ["mechanical", "heavy", "buildingLike"],
      abilities: ["deployTurret"],
      counters: ["push", "infantry"],
      weak: ["air", "emp", "siege"],
      desc: "部署后成为前线防御核心。"
    },
    meatBug: {
      name: "噬肉虫",
      faction: "yaoshou",
      role: "廉价虫海",
      hp: 160,
      damage: [15, 22],
      attackSpeed: 1.35,
      range: 38,
      armor: 0,
      speed: 154,
      sight: 380,
      supply: 1,
      trainTime: 8,
      cost: { gold: 40, wood: 30 },
      tags: ["beast", "swarm", "light"],
      abilities: ["devour"],
      counters: ["worker", "archer", "isolated"],
      weak: ["aoe", "fire", "poison"],
      desc: "虫海基础单位，可吞噬成长。"
    },
    burstBug: {
      name: "爆浆虫",
      faction: "yaoshou",
      role: "自爆破阵",
      hp: 120,
      damage: [90, 120],
      attackSpeed: 0.1,
      range: 50,
      armor: 0,
      speed: 144,
      sight: 360,
      supply: 1,
      trainTime: 12,
      cost: { gold: 65, wood: 50 },
      tags: ["beast", "swarm", "explode"],
      abilities: ["selfDetonate"],
      counters: ["cluster", "building", "shield"],
      weak: ["ranged", "slow", "air"],
      desc: "接近目标后自爆，连锁科技后更危险。"
    },
    stingerBug: {
      name: "地刺虫",
      faction: "yaoshou",
      role: "潜伏伏击",
      hp: 220,
      damage: [32, 44],
      attackSpeed: 1,
      range: 62,
      armor: 1,
      speed: 126,
      sight: 420,
      supply: 2,
      trainTime: 18,
      cost: { gold: 90, wood: 70 },
      tags: ["beast", "ambush", "light"],
      abilities: ["burrow"],
      counters: ["backline", "cavalry", "engineer"],
      weak: ["detector", "aoe"],
      desc: "埋地后首次攻击造成额外伤害。"
    },
    motherBug: {
      name: "巨母虫",
      faction: "yaoshou",
      role: "虫海核心",
      hp: 1150,
      damage: [32, 46],
      attackSpeed: 0.75,
      range: 180,
      armor: 4,
      speed: 76,
      sight: 500,
      supply: 5,
      trainTime: 50,
      cost: { gold: 360, wood: 260, metal: 80 },
      unlockTech: "bloodStorage",
      tags: ["beast", "heavy", "support"],
      abilities: ["spawnBugs", "devour"],
      counters: ["attrition"],
      weak: ["focus", "pierce", "fire"],
      desc: "持续召唤小虫，虫海核心。"
    },
    tigerBeast: {
      name: "虎妖",
      faction: "yaoshou",
      role: "爆发近战",
      hp: 620,
      damage: [58, 78],
      attackSpeed: 1.05,
      range: 48,
      armor: 3,
      speed: 174,
      sight: 440,
      supply: 3,
      trainTime: 28,
      cost: { gold: 190, wood: 80, metal: 50 },
      tags: ["beast", "fast", "medium"],
      abilities: ["pounce", "devour"],
      counters: ["ranged", "support", "light"],
      weak: ["heavy", "control", "antiCavalry"],
      desc: "突袭远程和后勤。"
    },
    taotie: {
      name: "饕餮兽",
      faction: "yaoshou",
      role: "超肉前排",
      hp: 1500,
      damage: [52, 70],
      attackSpeed: 0.85,
      range: 54,
      armor: 8,
      speed: 86,
      sight: 420,
      supply: 6,
      trainTime: 55,
      cost: { gold: 420, wood: 160, stone: 180, metal: 120 },
      unlockTech: "devourBoost",
      tags: ["beast", "heavy", "large"],
      abilities: ["devourHeal"],
      counters: ["lowDamage", "frontline"],
      weak: ["pierce", "poison", "kite"],
      desc: "击杀小型单位回血。"
    },
    mammothBeast: {
      name: "猛犸妖",
      faction: "yaoshou",
      role: "冲阵 AOE",
      hp: 1280,
      damage: [76, 104],
      attackSpeed: 0.7,
      range: 62,
      armor: 6,
      speed: 104,
      sight: 440,
      supply: 5,
      trainTime: 48,
      cost: { gold: 360, wood: 160, stone: 120, metal: 100 },
      unlockTech: "boneArmor",
      tags: ["beast", "heavy", "charge", "large"],
      abilities: ["trample"],
      counters: ["cluster", "ranged"],
      weak: ["spearWall", "slow", "pierce"],
      desc: "冲阵击退密集阵型。"
    },
    shadowWolf: {
      name: "影狼妖",
      faction: "yaoshou",
      role: "隐身突袭",
      hp: 420,
      damage: [44, 62],
      attackSpeed: 1.15,
      range: 44,
      armor: 1,
      speed: 188,
      sight: 500,
      supply: 2,
      trainTime: 28,
      cost: { gold: 180, wood: 70 },
      unlockTech: "toxicGland",
      tags: ["beast", "stealth", "light"],
      abilities: ["stealth", "devour"],
      counters: ["worker", "backline"],
      weak: ["detector", "tower", "aoe"],
      desc: "脱战后隐匿，切资源线。"
    },
    waterSprite: natureUnit("水灵", "water", "水系远程", 360, 28, 1.2, 225, 1, 142, 2, 18, { gold: 90, wood: 60 }, ["waterWave"]),
    rainCaller: natureUnit("雨灵术士", "water", "治疗 / 雨幕", 420, 24, 1, 250, 1, 126, 2, 22, { gold: 120, wood: 70, stone: 20 }, ["rainWard", "heal"]),
    iceBlade: natureUnit("冰晶刃卫", "water", "减速穿甲", 620, 58, 0.8, 68, 4, 132, 3, 32, { gold: 220, wood: 90, metal: 140 }, ["freezeStrike"]),
    tideGiant: natureUnit("潮汐巨灵", "water", "水面重型", 1350, 56, 0.85, 70, 5, 96, 5, 45, { gold: 260, wood: 140, stone: 100 }, ["tideReturn"]),
    fireSprite: natureUnit("火灵", "fire", "火系输出", 360, 36, 1.1, 200, 1, 132, 2, 18, { gold: 100, wood: 70 }, ["flameBurst"]),
    emberThrower: natureUnit("灵果投手", "fire", "范围燃烧", 420, 52, 0.75, 225, 1, 114, 3, 28, { gold: 170, wood: 90, metal: 30 }, ["fireFruit"]),
    flameGiant: natureUnit("火焰巨人", "fire", "重型范围推进", 1050, 70, 0.8, 70, 4, 106, 5, 42, { gold: 240, wood: 120, stone: 60, metal: 80 }, ["lavaStomp"]),
    earthGuard: natureUnit("岩卫", "earth", "抗冲锋", 720, 32, 0.9, 54, 5, 94, 3, 25, { gold: 120, wood: 70, stone: 120 }, ["stoneGuard"]),
    stoneTurtle: natureUnit("玄龟灵", "earth", "高护甲肉盾", 1100, 22, 0.8, 54, 8, 78, 4, 34, { gold: 180, wood: 90, stone: 180 }, ["shellWall"]),
    mountainGiant: natureUnit("山岳巨人", "earth", "攻城重踏", 2400, 82, 0.65, 72, 10, 70, 8, 70, { gold: 420, wood: 160, stone: 380, metal: 80 }, ["earthStomp"]),
    metalFencer: natureUnit("金刃卫", "metal", "近战破甲", 520, 44, 1.1, 54, 3, 136, 2, 22, { gold: 130, wood: 50, metal: 80 }, ["bladeWheel"]),
    bladeArcher: natureUnit("刃弩灵", "metal", "远程穿甲", 420, 58, 0.75, 325, 2, 112, 3, 32, { gold: 220, wood: 90, metal: 140 }, ["pierceShot"]),
    goldGuard: natureUnit("金刚战傀", "metal", "重甲守卫", 980, 36, 0.9, 58, 8, 88, 4, 40, { gold: 260, wood: 80, metal: 220 }, ["goldReflect"]),
    woodHealer: natureUnit("治愈莲灵", "wood", "治疗净化", 480, 30, 1.1, 200, 2, 122, 2, 20, { gold: 80, wood: 120 }, ["lotusCleanse", "heal"]),
    rootGuard: natureUnit("森藤卫", "wood", "缠绕控制", 620, 18, 1, 250, 2, 112, 3, 30, { gold: 150, wood: 160 }, ["rootSnare"]),
    treeElder: natureUnit("古树长老", "wood", "区域庇护", 1450, 48, 0.75, 70, 5, 82, 5, 48, { gold: 220, wood: 260, stone: 80 }, ["forestShelter"]),
    steamSpirit: natureUnit("蒸汽灵械", "water", "雾气遮蔽", 1350, 54, 0.85, 225, 5, 118, 6, 42, { gold: 300, wood: 120, stone: 80, metal: 60 }, ["steamMist"], ["fusion"]),
    mudGiant: natureUnit("泥沼巨灵", "earth", "减速控场", 2100, 58, 0.75, 70, 9, 82, 8, 52, { gold: 380, wood: 100, stone: 320 }, ["mudField"], ["fusion"]),
    fireTree: natureUnit("火魔树", "fire", "燃烧召唤", 1750, 68, 0.7, 300, 5, 86, 8, 55, { gold: 440, wood: 420, metal: 80 }, ["fireFruit"], ["fusion"]),
    rockGoldGuard: natureUnit("岩金守卫", "metal", "超高护甲", 2400, 74, 0.7, 62, 14, 70, 9, 58, { gold: 500, stone: 360, metal: 300 }, ["goldReflect"], ["fusion"]),
    beastCavalry: hybridUnit("镇妖虎骑", "妖兽骑兵", 820, 64, 1.1, 54, 4, 210, 4, { gold: 280, wood: 100, metal: 80 }, ["charge", "seal"]),
    musket: hybridUnit("火铳兵", "火器步兵", 520, 62, 0.75, 310, 2, 116, 3, { gold: 180, metal: 100 }, ["volleyFire"]),
    arrayBot: hybridUnit("阵列机器人", "成组机械", 600, 46, 1.05, 220, 3, 118, 3, { gold: 160, metal: 120 }, ["arraySync"]),
    fiveElementSoldier: hybridUnit("五行步卒", "五行姿态", 680, 46, 1, 58, 4, 128, 3, { gold: 180, wood: 80, stone: 80 }, ["elementShift"]),
    spiritMech: hybridUnit("灵能机甲", "元素武装", 1200, 70, 0.82, 230, 6, 106, 5, { gold: 420, wood: 120, metal: 220 }, ["elementCannon"]),
    mechBug: hybridUnit("机械虫群", "机械爆浆", 150, 22, 1.4, 40, 1, 160, 1, { gold: 45, metal: 25 }, ["selfDetonate"]),
    woodTiger: hybridUnit("藤甲虎灵", "木系突击", 1200, 72, 0.95, 54, 6, 176, 5, { gold: 380, wood: 260 }, ["vinePounce"])
  };

  function natureUnit(name, element, role, hp, damage, attackSpeed, range, armor, speed, supply, trainTime, cost, abilities, extraTags = []) {
    return {
      name,
      faction: "ziran",
      role,
      hp,
      damage: [Math.round(damage * 0.85), Math.round(damage * 1.15)],
      attackSpeed,
      range,
      armor,
      speed,
      sight: 480,
      supply,
      trainTime,
      cost,
      element,
      tags: ["element", element, ...extraTags],
      abilities,
      counters: ELEMENT_BEATS[element] || [],
      weak: [],
      desc: `${role}。受到五行克制和地形强化影响。`
    };
  }

  function hybridUnit(name, role, hp, damage, attackSpeed, range, armor, speed, supply, cost, abilities) {
    return {
      name,
      faction: "ronghe",
      role,
      hp,
      damage: [Math.round(damage * 0.86), Math.round(damage * 1.14)],
      attackSpeed,
      range,
      armor,
      speed,
      sight: 500,
      supply,
      fusionSupply: Math.max(1, supply - 1),
      trainTime: Math.max(20, Math.round(supply * 7 + 12)),
      cost,
      tags: ["hybrid", role.includes("机械") ? "mechanical" : "medium"],
      abilities,
      desc: `${role}。占用融合人口，依赖占领核心供给。`
    };
  }

  const TECHS = {
    conscription: tech("急征令", "战略", 20, { gold: 120 }, "主城工兵训练速度 +50%，持续30秒。", { ability: "conscription" }),
    warOrder: tech("整军令", "战略", 45, { gold: 300, wood: 100 }, "解锁主城整军令：生产速度 +20%。", { ability: "warOrder" }),
    fortifyOrder: tech("守城令", "战略", 45, { gold: 300, stone: 240, metal: 60 }, "解锁主城守城令：建筑护甲 +2。", { ability: "fortifyOrder" }),
    heavenOrder: tech("天威令", "战略", 75, { gold: 600, wood: 200, stone: 200, metal: 200 }, "解锁天威令：全军攻击 +10%，护甲 +1。", { ability: "heavenOrder", town: 3 }),
    spearWall: tech("枪阵训练", "步兵", 30, { gold: 150, wood: 80 }, "枪兵停止移动后进入枪阵，反骑兵伤害 +25%。", { unlockAbility: "spearWall" }),
    shieldWall: tech("盾墙训练", "步兵", 35, { gold: 180, wood: 100, metal: 60 }, "解锁刀盾兵和举盾推进。", { unlockUnit: "shieldman" }),
    dogTraining: tech("驯犬令", "步兵", 25, { gold: 120 }, "解锁军犬，军犬可发现隐蔽单位。", { unlockUnit: "warDog" }),
    engineerDecree: tech("工造署令", "步兵", 40, { gold: 220, wood: 120 }, "解锁工程师，占领中立和部分敌方建筑。", { unlockUnit: "engineer", town: 2 }),
    swiftMarch: tech("迅捷步伐", "步兵", 45, { gold: 240 }, "步兵获得短时移速技能。", { unlockAbility: "swiftMarch", level: 2 }),
    veteranDrill: tech("老兵整训", "步兵", 50, { gold: 300 }, "步兵经验获取 +10%。", { buff: "veteran" }),
    royalGuard: tech("禁军编制", "步兵", 70, { gold: 500, metal: 250 }, "解锁羽林卫。", { unlockUnit: "guard", town: 3 }),
    strongBow: tech("强弓训练", "射击", 30, { gold: 160, wood: 120 }, "弓手射程 +0.5，攻击 +5%。", { buff: "strongBow" }),
    antiAirDrill: tech("仰射弩阵", "射击", 45, { gold: 260, wood: 160, metal: 100 }, "解锁防空弩兵。", { unlockUnit: "antiAir", level: 2 }),
    fireArrow: tech("火箭矢", "射击", 45, { gold: 260, wood: 180, metal: 40 }, "解锁火箭矢：点燃，对建筑伤害 +10%。", { arrow: "fire", level: 2 }),
    poisonArrow: tech("毒箭矢", "射击", 45, { gold: 260, wood: 120, metal: 20 }, "解锁毒箭矢：中毒，降低治疗效果。", { arrow: "poison", level: 2 }),
    slowArrow: tech("缓速箭矢", "射击", 50, { gold: 300, wood: 160, metal: 60 }, "解锁缓速箭矢：减速目标。", { arrow: "slow", level: 2 }),
    pierceArrow: tech("穿甲箭矢", "射击", 65, { gold: 420, wood: 120, metal: 220 }, "解锁穿甲箭矢：伤害 +20%，降低护甲。", { arrow: "pierce", level: 3 }),
    crossbowCraft: tech("神臂弩制", "射击", 70, { gold: 480, wood: 200, metal: 280 }, "解锁神臂弩手。", { unlockUnit: "crossbowElite", town: 3 }),
    chargeDrill: tech("骑兵操练", "骑兵", 40, { gold: 220 }, "骑兵训练速度 +10%，轻骑兵解锁突袭。", { buff: "cavalryTrain" }),
    raiderTactics: tech("游骑战法", "骑兵", 55, { gold: 320, wood: 120, metal: 80 }, "解锁游击骑。", { unlockUnit: "raiderCavalry", level: 2 }),
    heavyCavalry: tech("重骑甲胄", "骑兵", 60, { gold: 380, metal: 220 }, "解锁重骑兵，冲锋时护甲 +2。", { unlockUnit: "heavyCavalry", level: 2 }),
    blackCavalry: tech("玄甲军制", "骑兵", 90, { gold: 700, metal: 420 }, "解锁玄甲重骑。", { unlockUnit: "blackCavalry", town: 3 }),
    catapultTech: tech("投石机括", "攻城", 65, { gold: 420, wood: 300, stone: 120, metal: 180 }, "解锁投石车。", { unlockUnit: "catapult", level: 2 }),
    ladderTech: tech("登城器械", "攻城", 60, { gold: 360, wood: 280, stone: 80 }, "解锁云梯车。", { unlockUnit: "ladderCart", level: 2 }),
    pierceCartTech: tech("神机弩造", "攻城", 85, { gold: 620, wood: 350, metal: 300 }, "解锁神机弩车。", { unlockUnit: "pierceCart", level: 3 }),
    fireCartTech: tech("火油攻城", "攻城", 75, { gold: 500, wood: 240, metal: 100 }, "解锁火油车。", { unlockUnit: "fireCart", level: 3 }),
    siegeAim: tech("攻城瞄准", "攻城", 60, { gold: 420, metal: 220 }, "攻击被烽火台揭示建筑时射程和命中提高。", { buff: "siegeAim" }),
    defenseFormation: tech("固守阵", "阵法", 35, { gold: 200, stone: 120 }, "解锁固守阵：步兵护甲 +1。", { formation: "defense" }),
    arrowFormation: tech("锋矢阵", "阵法", 45, { gold: 260 }, "解锁锋矢阵：近战攻击 +8%。", { formation: "arrow", level: 2 }),
    snakeFormation: tech("长蛇阵", "阵法", 45, { gold: 260 }, "解锁长蛇阵：单位移速 +8%。", { formation: "snake", level: 2 }),
    royalFormation: tech("羽林阵", "阵法", 65, { gold: 460, metal: 80 }, "解锁羽林阵：高星单位经验提高。", { formation: "royal", level: 3 }),
    beaconWarn: tech("烽火预警", "防御", 30, { gold: 180, wood: 100 }, "敌军进入视野时小地图预警。", { buff: "beaconWarn" }),
    hawkBeacon: tech("鹰烽联络", "防御", 50, { gold: 300, wood: 120, metal: 80 }, "斥候鹰标记后烽火台侦察冷却降低。", { buff: "hawkBeacon" }),
    hawkEye: tech("鹰眼侦察", "空军", 30, { gold: 180, wood: 100 }, "斥候鹰视野 +25%。", { buff: "hawkEye" }),
    skyRiderTraining: tech("飞羽骑训", "空军", 50, { gold: 300, wood: 180 }, "解锁飞羽骑。", { unlockUnit: "skyRider" }),
    airIntercept: tech("空中截击", "空军", 55, { gold: 320, wood: 200, metal: 120 }, "解锁防空鹰弩。", { unlockUnit: "skyBolter", level: 2 }),
    lowDive: tech("低空俯冲", "空军", 50, { gold: 300, wood: 160 }, "飞羽骑俯冲伤害 +20%。", { buff: "lowDive", level: 2 }),
    cloudMove: tech("云层机动", "空军", 50, { gold: 280, metal: 50 }, "飞行单位获得云层机动。", { unlockAbility: "cloudMove", level: 2 }),
    armorHawkTech: tech("鹰弩破甲", "空军", 65, { gold: 420, wood: 160, metal: 260 }, "解锁破甲鹰弩。", { unlockUnit: "armorHawk", level: 2 }),
    towerAntiAir: tech("反空弩阵", "空军", 60, { gold: 360, metal: 220 }, "防御塔对空伤害和命中提高。", { buff: "towerAntiAir", level: 2 }),
    skyMarshalCode: tech("天羽军制", "空军", 90, { gold: 700, wood: 350, metal: 120 }, "解锁天羽都尉。", { unlockUnit: "skyMarshal", level: 3 }),
    landingDrill: tech("登陆操练", "水军", 40, { gold: 220, wood: 120 }, "运兵舟装载和卸载速度提高。", { buff: "landingDrill" }),
    boatBolter: tech("水上弩台", "水军", 45, { gold: 260, wood: 180 }, "解锁弩舟。", { unlockUnit: "boltBoat" }),
    shipHull: tech("舟船加固", "水军", 55, { gold: 300, wood: 180, metal: 150 }, "水上单位生命 +12%，移速 -3%。", { buff: "shipHull", level: 2 }),
    waveMove: tech("鼓浪推进", "水军", 50, { gold: 280, wood: 160 }, "水上单位获得鼓浪推进。", { unlockAbility: "waveMove", level: 2 }),
    towerShipTech: tech("楼船营造", "水军", 70, { gold: 500, wood: 350, metal: 180 }, "解锁楼船。", { unlockUnit: "towerShip", level: 2 }),
    rocketNavy: tech("火箭水师", "水军", 75, { gold: 520, wood: 260, metal: 80 }, "解锁火箭舟。", { unlockUnit: "rocketBoat", level: 2 }),
    shoreCalibrate: tech("岸防校准", "水军", 50, { gold: 320, metal: 140 }, "水军攻击岸边目标命中和伤害提高。", { buff: "shoreCalibrate", level: 2 }),
    dragonNavy: tech("水师军令", "水军", 95, { gold: 760, wood: 400, metal: 120 }, "解锁龙舟旗舰。", { unlockUnit: "dragonShip", level: 3 }),
    medicSystem: tech("军医制度", "后勤", 50, { gold: 260, metal: 40 }, "解锁医官队。", { unlockUnit: "medic", level: 2 }),
    repairSystem: tech("军械修缮", "后勤", 50, { gold: 280, wood: 180, metal: 140 }, "解锁修理车。", { unlockUnit: "repairCart", level: 2 }),
    drumCommand: tech("军鼓号令", "后勤", 55, { gold: 300, wood: 160 }, "解锁鼓舞车。", { unlockUnit: "drumCart", level: 2 }),
    bannerCommand: tech("旗令调度", "后勤", 70, { gold: 480, metal: 80 }, "解锁旗令车。", { unlockUnit: "bannerCart", level: 3 }),
    turboPower: tech("高效涡轮", "能源", 40, { gold: 220, metal: 80 }, "发电站电力 +15%。", { buff: "turboPower" }),
    highVoltage: tech("高压传输", "能源", 45, { gold: 260, metal: 120 }, "高压电塔连接距离 +20%。", { buff: "highVoltage" }),
    energyOverload: tech("能源过载协议", "能源", 55, { gold: 360, metal: 160 }, "解锁建筑和单位过载。", { unlockAbility: "overload" }),
    tankChassis: tech("坦克底盘", "重装", 55, { gold: 360, metal: 220 }, "解锁主战坦克。", { unlockUnit: "tank" }),
    aaMissile: tech("防空导弹科技", "重装", 50, { gold: 320, metal: 180 }, "解锁防空导弹车。", { unlockUnit: "aaTruck" }),
    fireControlAI: tech("火控AI", "AI", 55, { gold: 300, metal: 180 }, "单位自动优先攻击克制目标。", { buff: "fireControlAI" }),
    autoRepairAI: tech("维修AI", "AI", 55, { gold: 300, metal: 160 }, "维修单位自动修理低血机械。", { unlockUnit: "engineTruck", buff: "autoRepairAI" }),
    moduleSlots: tech("基础模块工程", "改造", 50, { gold: 320, metal: 180 }, "解锁改造模块和重装动力机甲。", { unlockUnit: "heavyMech", unlockAbility: "modify" }),
    railStrike: tech("超载核心", "终局", 80, { gold: 700, metal: 420, stone: 200 }, "解锁高达型机甲和轨道轰击。", { unlockUnit: "gundam", unlockAbility: "railStrike" }),
    devourBoost: tech("强化吞噬", "吞噬", 40, { gold: 220, blood: 80 }, "吞噬属性收益 +15%，解锁饕餮兽。", { unlockUnit: "taotie", buff: "devourBoost" }),
    bloodStorage: tech("妖血储存", "吞噬", 45, { gold: 260, blood: 100 }, "吞噬容量 +1，解锁巨母虫。", { unlockUnit: "motherBug" }),
    bloodRage: tech("妖血暴走", "吞噬", 45, { gold: 300, blood: 120 }, "吞噬后攻速 +15%。", { buff: "bloodRage" }),
    toxicGland: tech("毒腺滋生", "变异", 50, { gold: 280, wood: 120, blood: 100 }, "解锁毒性词条和影狼妖。", { unlockUnit: "shadowWolf" }),
    boneArmor: tech("妖骨重甲", "凶兽", 50, { gold: 300, stone: 180, blood: 80 }, "重装兽护甲 +2，解锁猛犸妖。", { unlockUnit: "mammothBeast", buff: "boneArmor" }),
    beastTide: tech("万兽狂潮", "终局", 70, { gold: 600, blood: 240 }, "解锁兽潮号令。", { unlockAbility: "beastTide" }),
    elementResonance: tech("元素共鸣", "融合", 45, { gold: 300, wood: 180, stone: 120 }, "解锁元素融合坛基础融合。", { unlockAbility: "fusion" }),
    dualFusion: tech("双相融合", "融合", 60, { gold: 420, wood: 120, stone: 120, metal: 120 }, "解锁双属性融合单位。", { unlockUnits: ["steamSpirit", "mudGiant", "fireTree", "rockGoldGuard"] }),
    fusionStable: tech("融合稳定", "融合", 55, { gold: 420, metal: 160 }, "融合时间 -15%。", { buff: "fusionStable" }),
    weatherCycle: tech("五行轮转", "天象", 70, { gold: 600, wood: 180, stone: 180, metal: 180 }, "解锁周期天象。", { unlockAbility: "weather" }),
    fusionExpand: tech("融合扩建 I", "融合", 60, { gold: 400, stone: 220 }, "融合建筑上限 +2。", { buff: "fusionExpand" }),
    fusionSupply: tech("融合人口 I", "融合", 70, { gold: 500, wood: 200, stone: 200 }, "融合人口比例提升。", { buff: "fusionSupply" }),
    supplyLink: tech("断供延迟", "供给", 70, { gold: 420, metal: 160 }, "断供保护时间 +30秒。", { buff: "supplyLink" }),
    hybridDrill: tech("融合生产优化", "生产", 80, { gold: 500, wood: 200, metal: 200 }, "融合单位训练速度 +10%。", { buff: "hybridDrill" }),
    routeMastery: tech("路线专精", "终局", 90, { gold: 700, metal: 260, stone: 200 }, "路线专属技能强化。", { buff: "routeMastery" })
  };

  function tech(name, category, time, cost, desc, meta = {}) {
    return { name, category, time, cost, desc, ...meta };
  }

  const FUSION_RECIPES = [
    { a: "water", b: "fire", result: "steamSpirit", name: "水 + 火" },
    { a: "water", b: "earth", result: "mudGiant", name: "水 + 土" },
    { a: "fire", b: "wood", result: "fireTree", name: "火 + 木" },
    { a: "earth", b: "metal", result: "rockGoldGuard", name: "土 + 金" }
  ];

  const LEVEL_PRESETS = {
    frontier: {
      id: "frontier",
      name: "充裕开荒",
      short: "资源宽松，敌方更克制",
      desc: "资源密度更高，敌人推进更慢，适合稳步发展与试阵。",
      art: "lumberCamp",
      resourceDensity: 1.35,
      enemyDifficulty: 0.76,
      enemyCount: 0.72,
      enemyWaveInterval: 56,
      enemyWaveCount: 3,
      enemyWaveGrowth: 0.45,
      enemyHpScale: 0.84,
      enemyDamageScale: 0.78,
      enemyBuildInterval: 46,
      enemyResearchInterval: 92,
      enemyBuildSpeed: 0.88,
      enemyIncomeMultiplier: 0.78,
      enemyAggression: 0.72,
      enemyStartResources: { gold: 380, wood: 320, stone: 180, metal: 60 },
      enemyStartBuildings: [
        { type: "townCenter", dx: 0, dy: 0, level: 1 },
        { type: "barracks", dx: -240, dy: 120 },
        { type: "tower", dx: -110, dy: -150 },
        { type: "house", dx: 180, dy: 70 },
        { type: "lumberCamp", dx: -320, dy: -80 }
      ],
      enemyStartUnits: [
        { type: "worker", dx: -260, dy: 210 },
        { type: "worker", dx: -230, dy: 230 },
        { type: "spearman", dx: -180, dy: 250 },
        { type: "archer", dx: -130, dy: 270 },
        { type: "lightCavalry", dx: -80, dy: 290 },
        { type: "warDog", dx: -30, dy: 250 }
      ]
    },
    balanced: {
      id: "balanced",
      name: "标准推进",
      short: "资源与压力平衡",
      desc: "资源密度和敌方节奏都较均衡，适合正式对局。",
      art: "townCenter",
      resourceDensity: 1.0,
      enemyDifficulty: 0.94,
      enemyCount: 1.0,
      enemyWaveInterval: 42,
      enemyWaveCount: 4,
      enemyWaveGrowth: 0.65,
      enemyHpScale: 0.94,
      enemyDamageScale: 0.9,
      enemyBuildInterval: 32,
      enemyResearchInterval: 68,
      enemyBuildSpeed: 1.0,
      enemyIncomeMultiplier: 0.92,
      enemyAggression: 0.92,
      enemyStartResources: { gold: 520, wood: 430, stone: 260, metal: 100 },
      enemyStartBuildings: [
        { type: "townCenter", dx: 0, dy: 0, level: 2 },
        { type: "barracks", dx: -240, dy: 120 },
        { type: "tower", dx: -120, dy: -160 },
        { type: "tower", dx: 170, dy: 50 },
        { type: "house", dx: 220, dy: -90 },
        { type: "lumberCamp", dx: -320, dy: -80 },
        { type: "quarry", dx: 260, dy: 120 }
      ],
      enemyStartUnits: [
        { type: "worker", dx: -280, dy: 210 },
        { type: "worker", dx: -250, dy: 230 },
        { type: "worker", dx: -220, dy: 250 },
        { type: "spearman", dx: -200, dy: 250 },
        { type: "archer", dx: -150, dy: 270 },
        { type: "spearman", dx: -100, dy: 290 },
        { type: "lightCavalry", dx: -50, dy: 250 },
        { type: "warDog", dx: 10, dy: 280 },
        { type: "crossbowElite", dx: 60, dy: 245 }
      ]
    },
    siege: {
      id: "siege",
      name: "硬仗攻坚",
      short: "资源偏紧，敌人更积极",
      desc: "资源密度更低，敌方会更快扩张、补建筑并加压出兵。",
      art: "tower",
      resourceDensity: 0.8,
      enemyDifficulty: 1.08,
      enemyCount: 1.22,
      enemyWaveInterval: 34,
      enemyWaveCount: 5,
      enemyWaveGrowth: 0.82,
      enemyHpScale: 1.02,
      enemyDamageScale: 0.98,
      enemyBuildInterval: 22,
      enemyResearchInterval: 50,
      enemyBuildSpeed: 1.12,
      enemyIncomeMultiplier: 1.06,
      enemyAggression: 1.08,
      enemyStartResources: { gold: 680, wood: 540, stone: 360, metal: 160 },
      enemyStartBuildings: [
        { type: "townCenter", dx: 0, dy: 0, level: 2 },
        { type: "barracks", dx: -250, dy: 110 },
        { type: "tower", dx: -120, dy: -160 },
        { type: "tower", dx: 180, dy: 50 },
        { type: "house", dx: 220, dy: -90 },
        { type: "lumberCamp", dx: -330, dy: -90 },
        { type: "quarry", dx: 260, dy: 130 },
        { type: "stable", dx: 30, dy: 220 }
      ],
      enemyStartUnits: [
        { type: "worker", dx: -300, dy: 210 },
        { type: "worker", dx: -270, dy: 230 },
        { type: "worker", dx: -240, dy: 250 },
        { type: "worker", dx: -210, dy: 270 },
        { type: "spearman", dx: -220, dy: 250 },
        { type: "archer", dx: -170, dy: 270 },
        { type: "spearman", dx: -120, dy: 290 },
        { type: "lightCavalry", dx: -70, dy: 250 },
        { type: "warDog", dx: -20, dy: 280 },
        { type: "crossbowElite", dx: 40, dy: 245 },
        { type: "shieldman", dx: 90, dy: 275 },
        { type: "heavyCavalry", dx: 140, dy: 255 }
      ]
    }
  };

  const state = {
    started: false,
    faction: "huaxia",
    battleState: "menu",
    menuPage: "home",
    enemyFaction: "huaxia",
    enemyTownLevel: 1,
    time: 0,
    lastFrame: performance.now(),
    paused: false,
    speed: 1,
    showHpBars: true,
    showDamageText: true,
    showSelectionNames: true,
    settingsOpen: false,
    level: 1,
    levelPresetId: "balanced",
    levelPreset: null,
    exp: 0,
    power: 128450,
    resources: {
      gold: 1286,
      wood: 1286,
      stone: 864,
      metal: 472,
      jade: 680,
      blood: 0,
      power: 0,
      supply: 0,
      supplyCap: 0,
      fusionSupply: 0,
      fusionCap: 12
    },
    income: {},
    researched: new Set(),
    unlockedArrowModes: new Set(["normal"]),
    activeArrow: "normal",
    activeFormation: "none",
    townLevel: 1,
    selected: [],
    hover: null,
    buildMode: null,
    commandMode: "select",
    panelTab: "command",
    buildCategory: "全部",
    cardCategory: "全部",
    groups: Array.from({ length: 10 }, () => []),
    camera: { x: 830, y: 590, zoom: 1 },
    mouse: { x: 0, y: 0, worldX: 0, worldY: 0, down: false, drag: null, button: 0 },
    keys: new Set(),
    nextId: 1,
    units: [],
    buildings: [],
    resourcesNodes: [],
    projectiles: [],
    particles: [],
    floaters: [],
    bubbles: [],
    decals: [],
    beams: [],
    terrain: [],
    events: [],
    missions: [],
    enemyWaveTimer: 24,
    enemyBuildTimer: 0,
    enemyResearchTimer: 0,
    enemyResources: {
      gold: 0,
      wood: 0,
      stone: 0,
      metal: 0,
      supply: 0,
      supplyCap: 0
    },
    enemyIncome: { gold: 0, wood: 0, stone: 0, metal: 0 },
    enemyTechs: new Set(),
    enemyModifiers: {
      trainSpeed: 1,
      buildSpeed: 1,
      damage: 1,
      range: 1,
      gather: 1
    },
    weather: null,
    weatherTimer: 0,
    selectedFactionDraft: "huaxia",
    selectedLevelDraft: "balanced",
    needsUi: true,
    needsMini: true,
    lastToast: 0,
    routes: {
      ronghe: "天工火器军"
    }
  };

  const viewAssets = {
    unit: new Map(),
    building: new Map(),
    faction: new Map()
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function distXY(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function uid() {
    return state.nextId++;
  }

  function formatNum(v) {
    if (v >= 10000) return `${(v / 10000).toFixed(v >= 100000 ? 1 : 2)}万`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}千`;
    return `${Math.floor(v)}`;
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  function resourceBagForOwner(owner) {
    return owner === "enemy" ? state.enemyResources : state.resources;
  }

  function incomeBagForOwner(owner) {
    return owner === "enemy" ? state.enemyIncome : state.income;
  }

  function hasCostForOwner(owner, cost) {
    const bag = resourceBagForOwner(owner);
    return Object.entries(cost || {}).every(([k, v]) => (bag[k] || 0) >= v);
  }

  function payForOwner(owner, cost) {
    if (!hasCostForOwner(owner, cost)) return false;
    const bag = resourceBagForOwner(owner);
    Object.entries(cost || {}).forEach(([k, v]) => {
      bag[k] = (bag[k] || 0) - v;
    });
    if (owner === "player") state.needsUi = true;
    return true;
  }

  function addResourcesForOwner(owner, gain) {
    const bag = resourceBagForOwner(owner);
    Object.entries(gain || {}).forEach(([k, v]) => {
      bag[k] = (bag[k] || 0) + v;
    });
    if (owner === "player") state.needsUi = true;
  }

  function hasCost(cost) {
    return hasCostForOwner("player", cost);
  }

  function pay(cost) {
    return payForOwner("player", cost);
  }

  function addResources(gain) {
    addResourcesForOwner("player", gain);
  }

  function costText(cost) {
    const pairs = Object.entries(cost || {});
    if (!pairs.length) return "免费";
    return pairs.map(([k, v]) => `${RES[k]?.short || k}${v}`).join(" ");
  }

  function hasTech(id) {
    return state.researched.has(id);
  }

  function isUnitUnlocked(id) {
    const u = UNITS[id];
    if (!u) return false;
    if (u.faction !== "all" && u.faction !== state.faction) return false;
    if (u.unlockTech && !hasTech(u.unlockTech)) return false;
    return true;
  }

  function isBuildingAvailable(id) {
    const b = BUILDINGS[id];
    if (!b) return false;
    if (b.faction !== "all" && b.faction !== state.faction) return false;
    if ((b.unlockTown || 1) > state.townLevel) return false;
    if (b.requiresAny?.length && !b.requiresAny.some((req) => state.buildings.some((x) => x.owner === "player" && x.type === req && x.built))) {
      return false;
    }
    return true;
  }

  function isTechAvailable(id, provider) {
    const t = TECHS[id];
    if (!t || hasTech(id)) return false;
    if (t.town && state.townLevel < t.town) return false;
    if (t.level && provider?.level < t.level) return false;
    return true;
  }

  function isBuildingAvailableForOwner(id, owner, townLevel = 1, faction = "huaxia") {
    const b = BUILDINGS[id];
    if (!b) return false;
    if (b.faction !== "all" && b.faction !== faction) return false;
    if ((b.unlockTown || 1) > townLevel) return false;
    if (b.requiresAny?.length && !b.requiresAny.some((req) => buildingsForOwner(owner).some((x) => x.type === req && x.built))) return false;
    return true;
  }

  function isUnitUnlockedForOwner(id, owner, techs = new Set(), faction = "huaxia") {
    const u = UNITS[id];
    if (!u) return false;
    if (u.faction !== "all" && u.faction !== faction) return false;
    if (u.unlockTech && !techs.has(u.unlockTech)) return false;
    return true;
  }

  function isTechAvailableForOwner(id, owner, townLevel = 1, providerLevel = 1, techs = new Set()) {
    const t = TECHS[id];
    if (!t || techs.has(id)) return false;
    if (t.town && townLevel < t.town) return false;
    if (t.level && providerLevel < t.level) return false;
    return true;
  }

  function factionBuildings() {
    return Object.entries(BUILDINGS).filter(([id]) => isBuildingAvailable(id));
  }

  function factionUnitsForBuilding(building) {
    const b = BUILDINGS[building.type];
    return (b.canTrain || []).filter((id) => {
      const u = UNITS[id];
      if (!u) return false;
      if (u.faction !== "all" && u.faction !== state.faction) return false;
      return isUnitUnlocked(id);
    });
  }

  function objectById(id) {
    return state.units.find((u) => u.id === id) || state.buildings.find((b) => b.id === id);
  }

  function selectedObjects() {
    return state.selected.map(objectById).filter(Boolean);
  }

  function playerUnits() {
    return state.units.filter((u) => u.owner === "player" && !u.dead);
  }

  function enemyUnits() {
    return state.units.filter((u) => u.owner === "enemy" && !u.dead);
  }

  function unitsForOwner(owner) {
    return state.units.filter((u) => u.owner === owner && !u.dead);
  }

  function isWorkerUnit(o) {
    return o?.kind === "unit" && o.owner === "player" && !o.dead && UNITS[o.type]?.tags?.includes("worker");
  }

  function isBuilderUnit(o) {
    return isWorkerUnit(o) && UNITS[o.type]?.abilities?.includes("build");
  }

  function selectedWorkers() {
    return selectedObjects().filter(isWorkerUnit);
  }

  function selectedBuilders() {
    return selectedObjects().filter(isBuilderUnit);
  }

  function availableGatherWorkers() {
    const selected = selectedWorkers();
    if (selected.length) return selected;
    return playerUnits().filter((u) => isWorkerUnit(u) && (u.order === "idle" || u.order === "gather"));
  }

  function playerBuildings() {
    return state.buildings.filter((b) => b.owner === "player" && !b.dead);
  }

  function enemyBuildings() {
    return state.buildings.filter((b) => b.owner === "enemy" && !b.dead);
  }

  function buildingsForOwner(owner) {
    return state.buildings.filter((b) => b.owner === owner && !b.dead);
  }

  function hasTechForOwner(owner, id) {
    if (owner === "player") return hasTech(id);
    if (owner === "enemy") return state.enemyTechs.has(id);
    return false;
  }

  function ownerHasTech(owner, id) {
    return hasTechForOwner(owner, id);
  }

  function enemyHasTech(id) {
    return state.enemyTechs.has(id);
  }

  function enemyObjects() {
    return [
      ...state.units.filter((u) => u.owner === "enemy" && !u.dead),
      ...state.buildings.filter((b) => b.owner === "enemy" && !b.dead && b.built)
    ];
  }

  function friendlyObjects(owner) {
    return [
      ...state.units.filter((u) => u.owner === owner && !u.dead),
      ...state.buildings.filter((b) => b.owner === owner && !b.dead)
    ];
  }

  function getTerrainAt(x, y) {
    const tx = clamp(Math.floor(x / TILE), 0, Math.floor(WORLD_W / TILE) - 1);
    const ty = clamp(Math.floor(y / TILE), 0, Math.floor(WORLD_H / TILE) - 1);
    return state.terrain[ty]?.[tx] || "grass";
  }

  function terrainElement(type) {
    if (type === "water") return "water";
    if (type === "fire") return "fire";
    if (type === "stone" || type === "ruin") return "earth";
    if (type === "metal") return "metal";
    if (type === "forest" || type === "grass") return "wood";
    return null;
  }

  function generateTerrain() {
    state.terrain = [];
    const cols = Math.ceil(WORLD_W / TILE);
    const rows = Math.ceil(WORLD_H / TILE);
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        const nx = x / cols;
        const ny = y / rows;
        const river = Math.abs(ny - 0.24 - Math.sin(nx * 7) * 0.05) < 0.035 || Math.abs(nx - 0.77 - Math.sin(ny * 8) * 0.04) < 0.025;
        let t = "grass";
        if (river) t = "water";
        else if (noise(x * 0.18, y * 0.18) > 0.62) t = "forest";
        else if (noise(x * 0.14 + 12, y * 0.14 - 8) > 0.7) t = "stone";
        else if (noise(x * 0.21 - 6, y * 0.21 + 14) > 0.76) t = "metal";
        row.push(t);
      }
      state.terrain.push(row);
    }
  }

  function noise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return n - Math.floor(n);
  }

  function initResourceNodes() {
    state.resourcesNodes = [];
    const preset = currentLevelPreset();
    const density = preset.resourceDensity || 1;
    const nodes = [
      ["wood", 530, 520, 6500], ["wood", 770, 880, 6200], ["wood", 1260, 520, 8000], ["wood", 2380, 620, 7200],
      ["stone", 1080, 980, 5200], ["stone", 460, 1260, 5000], ["stone", 2760, 1140, 6200],
      ["metal", 620, 1640, 4300], ["metal", 1780, 760, 5000], ["metal", 3060, 1580, 5200],
      ["gold", 930, 1370, 4500], ["gold", 2160, 460, 4600], ["gold", 2620, 1760, 5200]
    ];
    nodes.forEach(([type, x, y, amount]) => {
      const scaled = Math.round(amount * density);
      state.resourcesNodes.push({ id: uid(), type, x, y, amount: scaled, max: scaled, r: type === "wood" ? 58 : 44 });
    });
  }

  function createBuilding(type, owner, x, y, opts = {}) {
    const def = BUILDINGS[type];
    const levelPreset = currentLevelPreset();
    const enemyScale = owner === "enemy" ? (levelPreset.enemyHpScale || 1) : 1;
    const enemyArmor = owner === "enemy" ? Math.max(0, Math.round((levelPreset.enemyDifficulty - 1) * 2)) : 0;
    const b = {
      id: uid(),
      kind: "building",
      type,
      owner,
      x,
      y,
      r: (def.footprint || 2) * 17,
      hp: Math.round((opts.hp ?? def.hp) * enemyScale),
      maxHp: Math.round(def.hp * enemyScale),
      armor: (def.armor || 0) + enemyArmor,
      level: opts.level || (type === "townCenter" || type === "fusionCore" ? state.townLevel : 1),
      built: opts.built ?? true,
      buildRemaining: opts.built === false ? def.buildTime || 1 : 0,
      buildTotal: def.buildTime || 1,
      queue: [],
      researchQueue: [],
      rally: { x: x + 130, y: y + 70 },
      cooldown: 0,
      abilityCooldowns: {},
      powered: true,
      overloaded: 0,
      modifiers: [],
      fx: {
        buildPulse: opts.built === false ? 0.8 : 0,
        complete: 0,
        upgrade: 0,
        hitFlash: 0
      },
      dead: false,
      selected: false,
      openGate: false,
      route: opts.route || null
    };
    state.buildings.push(b);
    state.needsUi = true;
    state.needsMini = true;
    return b;
  }

  function createUnit(type, owner, x, y, opts = {}) {
    const def = UNITS[type];
    const star = opts.star || 1;
    const levelPreset = currentLevelPreset();
    const enemyScale = owner === "enemy" ? (levelPreset.enemyHpScale || 1) : 1;
    const enemyArmor = owner === "enemy" ? Math.max(0, Math.round((levelPreset.enemyDifficulty - 1) * 1.5)) : 0;
    const maxHp = Math.max(1, Math.round(scaleHp(def.hp, star) * enemyScale));
    const u = {
      id: uid(),
      kind: "unit",
      type,
      owner,
      x,
      y,
      vx: 0,
      vy: 0,
      r: unitRadius(def),
      hp: Math.min(opts.hp ?? maxHp, maxHp),
      maxHp,
      armor: scaleArmor(def.armor || 0, star) + enemyArmor,
      star,
      exp: opts.exp || 0,
      targetId: null,
      moveTarget: opts.moveTarget || null,
      order: "idle",
      cooldown: rand(0, 0.4),
      abilityCooldowns: {},
      status: [],
      pathOffset: { x: rand(-18, 18), y: rand(-18, 18) },
      dead: false,
      selected: false,
      carried: {},
      gatherTarget: null,
      mode: { arrow: "normal", formation: "none" },
      rallyFrom: opts.rallyFrom || null,
      modules: [],
      devour: 0,
      fusion: opts.fusion || false,
      fx: {
        spawn: opts.spawnFx ?? 0,
        order: 0,
        gather: 0,
        hitFlash: 0
      }
    };
    state.units.push(u);
    state.needsUi = true;
    state.needsMini = true;
    return u;
  }

  function unitRadius(def) {
    if (def.tags?.includes("ship")) return 22;
    if (def.tags?.includes("large") || def.tags?.includes("elite")) return 24;
    if (def.tags?.includes("heavy")) return 19;
    if (def.tags?.includes("swarm")) return 10;
    return 14;
  }

  function scaleHp(hp, star) {
    const mul = [1, 1.08, 1.16, 1.26, 1.4][star - 1] || 1;
    return Math.round(hp * mul);
  }

  function scaleArmor(armor, star) {
    return armor + ([0, 0, 1, 2, 3][star - 1] || 0);
  }

  function currentLevelPreset() {
    return LEVEL_PRESETS[state.levelPresetId] || LEVEL_PRESETS.balanced;
  }

  function applyLevelPreset(levelId = state.selectedLevelDraft || "balanced") {
    const preset = LEVEL_PRESETS[levelId] || LEVEL_PRESETS.balanced;
    state.levelPresetId = preset.id;
    state.levelPreset = preset;
    state.selectedLevelDraft = preset.id;
    state.enemyWaveTimer = preset.enemyWaveInterval;
    state.enemyBuildTimer = preset.enemyBuildInterval * 0.65;
    state.enemyResearchTimer = preset.enemyResearchInterval * 0.8;
    state.enemyTownLevel = preset.enemyDifficulty >= 1 ? 2 : 1;
    state.enemyResources = { ...preset.enemyStartResources };
    state.enemyIncome = { gold: 0, wood: 0, stone: 0, metal: 0 };
    state.enemyTechs = new Set();
    state.enemyModifiers = {
      trainSpeed: 1,
      buildSpeed: 1,
      damage: 1,
      range: 1,
      gather: 1
    };
  }

  function enemyWorkers() {
    return unitsForOwner("enemy").filter((u) => UNITS[u.type]?.tags?.includes("worker"));
  }

  function enemyMainBase() {
    return buildingsForOwner("enemy").find((b) => b.type === "townCenter" || b.type === "fusionCore") || buildingsForOwner("enemy")[0] || null;
  }

  function showMenuPage(page) {
    state.menuPage = page;
    const home = $("homePage");
    const levels = $("levelSelectPage");
    if (home) home.classList.toggle("hidden", page !== "home");
    if (levels) levels.classList.toggle("hidden", page !== "levelSelect");
    ui.startModal.classList.remove("hidden");
    setBattleHudVisible(false);
    state.settingsOpen = false;
    state.needsUi = true;
    renderMenuPages();
  }

  function setBattleHudVisible(visible) {
    document.querySelectorAll(".hud-runtime").forEach((el) => el.classList.toggle("hidden", !visible));
  }

  function levelDeltaText(v) {
    return `${Math.round(v * 100)}%`;
  }

  function renderMenuPages() {
    if (state.menuPage === "levelSelect") renderLevelSelectPage();
    else renderHomePage();
  }

  function renderHomePage() {
    const faction = FACTIONS[state.selectedFactionDraft];
    const preset = currentLevelPreset();
    const hero = preset.desc;
    if (ui.menuTitle) ui.menuTitle.textContent = "战枭";
    if (ui.menuSubtitle) ui.menuSubtitle.textContent = `${faction.name} · ${preset.name}`;
    if (ui.menuHeroText) ui.menuHeroText.textContent = `${faction.subtitle}。${hero}`;
    if (ui.menuHeroArt) ui.menuHeroArt.innerHTML = assetImg("faction", state.selectedFactionDraft, 320, 220);
    if (ui.menuHomeHint) {
      ui.menuHomeHint.innerHTML = [
        `资源密度 ${levelDeltaText(preset.resourceDensity)}，敌人数量 ${levelDeltaText(preset.enemyCount)}。`,
        `敌方强度 ${Math.round(preset.enemyDifficulty * 100)}%，波次间隔 ${Math.round(preset.enemyWaveInterval)} 秒。`
      ].join("<br>");
    }
    if (ui.menuLevelSnapshot) {
      ui.menuLevelSnapshot.innerHTML = `
        <div class="level-stat-row"><span>当前关卡</span><strong>${preset.name}</strong></div>
        <div class="level-stat-row"><span>资源密度</span><strong>${levelDeltaText(preset.resourceDensity)}</strong></div>
        <div class="level-stat-row"><span>敌人难度</span><strong>${Math.round(preset.enemyDifficulty * 100)}%</strong></div>
        <div class="level-stat-row"><span>敌人数</span><strong>${levelDeltaText(preset.enemyCount)}</strong></div>
      `;
    }
    renderFactionChoices();
  }

  function renderLevelSelectPage() {
    const preset = currentLevelPreset();
    if (ui.menuLevelTitle) ui.menuLevelTitle.textContent = `${preset.name} · ${preset.short}`;
    if (ui.menuLevelMeta) {
      ui.menuLevelMeta.textContent = `资源密度 ${levelDeltaText(preset.resourceDensity)} · 敌人难度 ${Math.round(preset.enemyDifficulty * 100)}% · 敌人数量 ${levelDeltaText(preset.enemyCount)}`;
    }
    if (ui.levelCardGrid) {
      ui.levelCardGrid.innerHTML = Object.values(LEVEL_PRESETS).map((level) => `
        <article class="level-card ${state.selectedLevelDraft === level.id ? "active" : ""}" data-level-card="${level.id}">
          <div class="level-card-head">
            <div class="level-card-title">${level.name}</div>
            <div class="level-card-sub">${level.short}</div>
          </div>
          <div class="level-art">${assetImg("building", level.art, 360, 180)}</div>
          <div class="level-meta">
            <div class="level-stat-row"><span>资源密度</span><strong>${levelDeltaText(level.resourceDensity)}</strong></div>
            <div class="level-stat-row"><span>敌人难度</span><strong>${Math.round(level.enemyDifficulty * 100)}%</strong></div>
            <div class="level-stat-row"><span>敌人数量</span><strong>${levelDeltaText(level.enemyCount)}</strong></div>
            <div class="level-stat-row"><span>波次间隔</span><strong>${Math.round(level.enemyWaveInterval)} 秒</strong></div>
          </div>
          <div class="level-tag-row">
            <span class="level-tag">开局资源 ${levelDeltaText(level.resourceDensity)}</span>
            <span class="level-tag">敌军规模 ${levelDeltaText(level.enemyCount)}</span>
            <span class="level-tag">AI ${Math.round(level.enemyDifficulty * 100)}%</span>
          </div>
          <div class="level-card-actions">
            <button class="primary-btn" data-level-select="${level.id}" type="button">选择</button>
            <button class="small-btn" data-level-start="${level.id}" type="button">开打</button>
          </div>
          <div class="menu-mini-copy">${level.desc}</div>
        </article>
      `).join("");
    }
  }

  function setSelectedLevelDraft(levelId) {
    if (!LEVEL_PRESETS[levelId]) return;
    state.selectedLevelDraft = levelId;
    state.levelPreset = LEVEL_PRESETS[levelId];
    state.levelPresetId = levelId;
    state.needsUi = true;
    renderMenuPages();
  }

  function setupGame(faction, levelId = state.selectedLevelDraft || "balanced") {
    applyLevelPreset(levelId);
    state.started = true;
    state.faction = faction;
    state.enemyFaction = "huaxia";
    state.battleState = "playing";
    state.menuPage = "home";
    state.time = 0;
    state.level = faction === "huaxia" ? 15 : faction === "jixie" ? 12 : faction === "ziran" ? 13 : faction === "yaoshou" ? 12 : 14;
    state.exp = 3260;
    state.power = faction === "huaxia" ? 128450 : faction === "jixie" ? 156800 : faction === "ziran" ? 118900 : faction === "yaoshou" ? 132200 : 146300;
    state.resources = initialResources(faction);
    state.researched = new Set();
    state.unlockedArrowModes = new Set(["normal"]);
    state.activeArrow = "normal";
    state.activeFormation = "none";
    state.townLevel = 1;
    state.selected = [];
    state.groups = Array.from({ length: 10 }, () => []);
    state.buildMode = null;
    state.commandMode = "select";
    state.panelTab = "command";
    state.nextId = 1;
    state.units = [];
    state.buildings = [];
    state.projectiles = [];
    state.particles = [];
    state.floaters = [];
    state.bubbles = [];
    state.decals = [];
    state.beams = [];
    state.events = [];
    state.missions = defaultMissions(faction);
    state.weather = null;
    state.weatherTimer = 0;
    generateTerrain();
    initResourceNodes();
    createStartingBase(faction);
    createEnemyBase();
    ui.startModal.classList.add("hidden");
    setBattleHudVisible(true);
    state.camera.x = 650;
    state.camera.y = 450;
    state.camera.zoom = 1;
    state.needsUi = true;
    state.needsMini = true;
    toast(`${FACTIONS[faction].name} 阵营部署完成`);
    warmAllEntityAssets();
  }

  function initialResources(faction) {
    const base = {
      gold: 1286,
      wood: 1286,
      stone: 864,
      metal: 472,
      jade: 0,
      blood: 0,
      power: 0,
      supply: 0,
      supplyCap: 0,
      fusionSupply: 0,
      fusionCap: 12
    };
    if (faction === "jixie") {
      base.metal = 864;
      base.stone = 472;
      base.power = 120;
    }
    if (faction === "yaoshou") {
      base.blood = 180;
      base.wood = 1500;
      base.metal = 260;
    }
    if (faction === "ziran") {
      base.jade = 680;
      base.wood = 1500;
      base.stone = 720;
    }
    if (faction === "ronghe") {
      base.metal = 760;
      base.jade = 260;
      base.blood = 90;
    }
    return base;
  }

  function enemyInitialResources(levelPreset) {
    return { ...(levelPreset?.enemyStartResources || {}) };
  }

  function defaultMissions(faction) {
    const common = [
      { title: "升级主城至 2 级", done: 0, need: 1, check: () => state.townLevel >= 2 ? 1 : 0, reward: { gold: 180, wood: 180 } },
      { title: "训练 12 个战斗单位", done: 0, need: 12, check: () => playerUnits().filter((u) => !UNITS[u.type].tags?.includes("worker")).length, reward: { gold: 150, metal: 80 } },
      { title: "摧毁敌方前哨", done: 0, need: 1, check: () => state.events.includes("enemyOutpostDown") ? 1 : 0, reward: { stone: 240, metal: 120 } }
    ];
    if (faction === "jixie") common[0].title = "建成稳定电网";
    if (faction === "yaoshou") common[0].title = "完成一次吞噬或圣祭";
    if (faction === "ziran") common[0].title = "完成一次元素融合";
    if (faction === "ronghe") common[0].title = "保持占领核心供给";
    return common;
  }

  function createStartingBase(faction) {
    const cx = 760;
    const cy = 640;
    let core = "townCenter";
    if (faction === "ronghe") core = "fusionCore";
    const main = createBuilding(core, "player", cx, cy, { built: true, level: 1, route: state.routes.ronghe });
    if (faction === "huaxia") {
      createBuilding("house", "player", cx - 190, cy + 110, { built: true });
      createBuilding("lumberCamp", "player", cx - 320, cy - 90, { built: true });
      createBuilding("quarry", "player", cx + 230, cy + 110, { built: true });
      createBuilding("barracks", "player", cx + 230, cy - 80, { built: true });
      createBuilding("dojo", "player", cx + 70, cy + 250, { built: true });
      for (let i = 0; i < 5; i++) createUnit("worker", "player", cx - 120 + i * 24, cy + 220 + (i % 2) * 24);
      for (let i = 0; i < 4; i++) createUnit(i % 2 ? "archer" : "spearman", "player", cx + 120 + i * 24, cy + 110 + (i % 2) * 22);
    } else if (faction === "jixie") {
      createBuilding("powerPlant", "player", cx - 210, cy + 80, { built: true });
      createBuilding("pylon", "player", cx + 10, cy + 230, { built: true });
      createBuilding("mechYard", "player", cx + 220, cy - 80, { built: true });
      createBuilding("factory", "player", cx + 260, cy + 160, { built: true });
      for (let i = 0; i < 5; i++) createUnit("machineWorker", "player", cx - 130 + i * 26, cy + 210 + (i % 2) * 24);
      createUnit("mechDog", "player", cx + 130, cy + 70);
      createUnit("lightMech", "player", cx + 170, cy + 110);
    } else if (faction === "yaoshou") {
      createBuilding("beastNest", "player", cx + 210, cy - 90, { built: true });
      createBuilding("beastDen", "player", cx + 200, cy + 150, { built: true });
      createBuilding("bloodPool", "player", cx - 220, cy + 90, { built: true });
      createBuilding("boneTower", "player", cx + 20, cy - 230, { built: true });
      for (let i = 0; i < 5; i++) createUnit("worker", "player", cx - 130 + i * 24, cy + 220 + (i % 2) * 24);
      for (let i = 0; i < 8; i++) createUnit("meatBug", "player", cx + 100 + i * 16, cy + 90 + (i % 3) * 18);
      createUnit("tigerBeast", "player", cx + 190, cy + 120);
    } else if (faction === "ziran") {
      createBuilding("waterPool", "player", cx - 230, cy - 80, { built: true });
      createBuilding("fireForge", "player", cx + 230, cy - 80, { built: true });
      createBuilding("woodGarden", "player", cx - 220, cy + 150, { built: true });
      createBuilding("fusionAltar", "player", cx + 220, cy + 170, { built: true });
      for (let i = 0; i < 4; i++) createUnit("worker", "player", cx - 120 + i * 24, cy + 220 + (i % 2) * 24);
      createUnit("waterSprite", "player", cx + 90, cy + 70);
      createUnit("fireSprite", "player", cx + 130, cy + 90);
      createUnit("woodHealer", "player", cx + 170, cy + 110);
    } else {
      createBuilding("hybridStable", "player", cx + 220, cy - 80, { built: true });
      createBuilding("hybridLab", "player", cx - 220, cy + 110, { built: true });
      createBuilding("hybridTower", "player", cx + 70, cy - 240, { built: true });
      for (let i = 0; i < 5; i++) createUnit("worker", "player", cx - 120 + i * 24, cy + 220 + (i % 2) * 24);
      createUnit("musket", "player", cx + 130, cy + 70);
      createUnit("fiveElementSoldier", "player", cx + 170, cy + 100);
      createUnit("beastCavalry", "player", cx + 200, cy + 130);
    }
    main.rally = { x: cx + 250, y: cy + 130 };
  }

  function createEnemyBase() {
    const preset = currentLevelPreset();
    const cx = 2700;
    const cy = 1450;
    const coreLevel = preset.enemyDifficulty >= 1.02 ? 2 : 1;
    const startBuildings = preset.enemyStartBuildings || [];
    for (const item of startBuildings) {
      createBuilding(item.type, "enemy", cx + item.dx, cy + item.dy, { built: true, level: item.level || coreLevel });
    }
    const startUnits = preset.enemyStartUnits || [];
    for (const item of startUnits) {
      createUnit(item.type, "enemy", cx + item.dx, cy + item.dy, { star: preset.enemyDifficulty >= 1.08 ? 2 : 1 });
    }
    if (!startBuildings.length) {
      createBuilding("townCenter", "enemy", cx, cy, { built: true, level: coreLevel });
      createBuilding("barracks", "enemy", cx - 240, cy + 120, { built: true });
      createBuilding("tower", "enemy", cx - 120, cy - 160, { built: true });
      createBuilding("tower", "enemy", cx + 180, cy + 40, { built: true });
      for (let i = 0; i < 8; i++) createUnit(i % 3 === 0 ? "lightCavalry" : i % 3 === 1 ? "archer" : "spearman", "enemy", cx - 240 + i * 42, cy + 260 + (i % 2) * 28);
    }
    createEnemyOutpost();
  }

  function createEnemyOutpost() {
    const cx = 1800;
    const cy = 1050;
    createBuilding("tower", "enemy", cx, cy, { built: true });
    createBuilding("house", "enemy", cx - 90, cy + 70, { built: true });
    createUnit("spearman", "enemy", cx + 80, cy + 110);
    createUnit("archer", "enemy", cx + 120, cy + 70);
  }

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.needsMini = true;
  }

  function screenToWorld(x, y) {
    return {
      x: state.camera.x + (x - window.innerWidth / 2) / state.camera.zoom,
      y: state.camera.y + (y - window.innerHeight / 2) / state.camera.zoom
    };
  }

  function worldToScreen(x, y) {
    return {
      x: (x - state.camera.x) * state.camera.zoom + window.innerWidth / 2,
      y: (y - state.camera.y) * state.camera.zoom + window.innerHeight / 2
    };
  }

  function panCamera(dx, dy) {
    state.camera.x = clamp(state.camera.x + dx / state.camera.zoom, window.innerWidth / (2 * state.camera.zoom), WORLD_W - window.innerWidth / (2 * state.camera.zoom));
    state.camera.y = clamp(state.camera.y + dy / state.camera.zoom, window.innerHeight / (2 * state.camera.zoom), WORLD_H - window.innerHeight / (2 * state.camera.zoom));
    state.needsMini = true;
  }

  function updateCamera(dt) {
    const speed = 620 * dt;
    let dx = 0;
    let dy = 0;
    if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) dx -= speed;
    if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) dx += speed;
    if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) dy -= speed;
    if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) dy += speed;
    const edge = 20;
    if (state.mouse.x < edge) dx -= speed;
    if (state.mouse.x > window.innerWidth - edge) dx += speed;
    if (state.mouse.y < edge) dy -= speed;
    if (state.mouse.y > window.innerHeight - edge) dy += speed;
    if (dx || dy) panCamera(dx, dy);
  }

  function toast(message, tone = "normal") {
    const now = performance.now();
    if (now - state.lastToast < 350 && state.toastLastMessage === message) return;
    state.lastToast = now;
    state.toastLastMessage = message;
    const el = document.createElement("div");
    el.className = `toast ${tone}`;
    el.textContent = message;
    ui.toastStack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(-8px)";
      el.style.transition = "opacity .25s ease, transform .25s ease";
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  function bubble(entity, text, type = "normal") {
    state.bubbles.push({ x: entity.x, y: entity.y - entity.r - 18, text, type, ttl: 1.7, max: 1.7, owner: entity.id });
  }

  function floating(x, y, text, type = "damage") {
    state.floaters.push({ x, y, text, type, ttl: 1.05, max: 1.05, vx: rand(-10, 10), vy: rand(-35, -20) });
  }

  function addParticle(x, y, color, count = 8, size = 3) {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: rand(-80, 80),
        vy: rand(-80, 80),
        color,
        size: rand(size * 0.6, size * 1.3),
        ttl: rand(0.35, 0.8),
        max: 0.8
      });
    }
  }

  function addBeam(x1, y1, x2, y2, color, ttl = 0.18, width = 2) {
    state.beams.push({ x1, y1, x2, y2, color, ttl, max: ttl, width });
  }

  function markFx(entity, key, ttl) {
    if (!entity) return;
    entity.fx = entity.fx || {};
    entity.fx[key] = Math.max(entity.fx[key] || 0, ttl);
  }

  function addCommandFeedback(x, y, kind = "move") {
    const decal = kind === "attack" ? "target" : kind === "gather" ? "gather" : "marker";
    const color = kind === "attack" ? "#ef5d4c" : kind === "gather" ? "#79d86d" : "#6ba8ff";
    createDecal(x, y, kind === "attack" ? 58 : 38, decal, 0.7, "player");
    addParticle(x, y, color, kind === "attack" ? 14 : 9, kind === "attack" ? 4 : 3);
    floating(x, y - 18, kind === "attack" ? "攻击" : kind === "gather" ? "采集" : "移动", kind === "gather" ? "resource" : kind === "attack" ? "fire" : "water");
  }

  function addEntityBurst(entity, kind = "spawn") {
    if (!entity) return;
    const color = entity.owner === "enemy" ? "#d45a48" : kind === "upgrade" ? "#ffd578" : "#68a9ff";
    const decal = kind === "upgrade" ? "upgrade" : kind === "complete" ? "complete" : "spawn";
    createDecal(entity.x, entity.y, entity.r + 26, decal, kind === "upgrade" ? 1.25 : 0.8, entity.owner);
    addParticle(entity.x, entity.y, color, kind === "upgrade" ? 34 : 20, kind === "upgrade" ? 6 : 4);
    markFx(entity, kind, kind === "upgrade" ? 1.2 : 0.75);
  }

  function update(dt) {
    if (!state.started) return;
    if (state.paused) {
      if (state.needsUi) renderUI();
      return;
    }
    const scaled = dt * state.speed;
    state.time += scaled;
    updateCamera(scaled);
    updateEconomy(scaled);
    updateBuildProgress(scaled);
    updateQueues(scaled);
    updateUnits(scaled);
    updateBuildingsCombat(scaled);
    updateProjectiles(scaled);
    updateParticles(scaled);
    updateMissions();
    updateWeather(scaled);
    state.resources.supply = playerUnits().reduce((sum, u) => sum + (UNITS[u.type].supply || 0), 0);
    state.resources.supplyCap = playerBuildings().reduce((sum, b) => sum + (BUILDINGS[b.type].supply || 0), 0);
    if (state.faction === "ronghe") {
      state.resources.fusionSupply = playerUnits().reduce((sum, u) => sum + (UNITS[u.type].fusionSupply || 0), 0);
      state.resources.fusionCap = hasTech("fusionSupply") ? 22 : 12;
    }
    updateEnemyState(scaled);
    if (state.needsUi) renderUI();
  }

  function updateEconomy(dt) {
    state.income = { gold: 0, wood: 0, stone: 0, metal: 0, jade: 0, blood: 0, power: 0 };
    for (const b of playerBuildings()) {
      if (!b.built) continue;
      const def = BUILDINGS[b.type];
      for (const [k, v] of Object.entries(def.income || {})) {
        const gain = v * (b.level > 1 ? 1 + b.level * 0.08 : 1);
        state.resources[k] = (state.resources[k] || 0) + gain * dt;
        state.income[k] += gain * 3600;
      }
      if (def.powerGen) {
        const gen = def.powerGen * (hasTech("turboPower") ? 1.15 : 1);
        state.income.power += gen;
      }
      if (def.powerUse) state.income.power -= def.powerUse;
    }
    const workers = playerUnits().filter((u) => UNITS[u.type].tags?.includes("worker"));
    for (const u of workers) {
      autoGather(u, dt);
    }
    if (state.faction === "jixie") {
      const generated = Math.max(0, state.income.power);
      const used = Math.max(0, -state.income.power);
      state.resources.power = Math.round(generated - used);
      const shortage = state.resources.power < 0;
      const mainBase = getMainBase();
      for (const b of playerBuildings()) {
        const def = BUILDINGS[b.type];
        b.powered = !def.powerUse || !shortage || (mainBase && distXY(b.x, b.y, mainBase.x, mainBase.y) < 520) || isNearPoweredNode(b);
      }
    }
    updateEnemyEconomy(dt);
  }

  function updateEnemyEconomy(dt) {
    const preset = currentLevelPreset();
    const enemyOwnBuildings = enemyBuildings();
    state.enemyIncome = { gold: 0, wood: 0, stone: 0, metal: 0 };
    for (const b of enemyOwnBuildings) {
      if (!b.built) continue;
      const def = BUILDINGS[b.type];
      for (const [k, v] of Object.entries(def.income || {})) {
        const gain = v * (b.level > 1 ? 1 + b.level * 0.08 : 1) * (preset.enemyIncomeMultiplier || 1);
        state.enemyResources[k] = (state.enemyResources[k] || 0) + gain * dt;
        state.enemyIncome[k] += gain * 3600;
      }
    }
    state.enemyResources.supply = enemyUnits().reduce((sum, u) => sum + (UNITS[u.type].supply || 0), 0);
    state.enemyResources.supplyCap = enemyOwnBuildings.reduce((sum, b) => sum + (BUILDINGS[b.type].supply || 0), 0);
    for (const u of enemyWorkers()) autoGather(u, dt);
    if (state.enemyFaction === "jixie") {
      const generated = Math.max(0, state.enemyIncome.power || 0);
      const used = Math.max(0, -(state.enemyIncome.power || 0));
      state.enemyResources.power = Math.round(generated - used);
    }
  }

  function updateEnemyState(dt) {
    const preset = currentLevelPreset();
    if (!preset) return;
    state.enemyBuildTimer -= dt;
    state.enemyResearchTimer -= dt;
    state.enemyWaveTimer -= dt;

    if (state.enemyWaveTimer <= 0) {
      state.enemyWaveTimer = preset.enemyWaveInterval + rand(-5, 8);
      spawnEnemyWave();
    }

    if (state.enemyBuildTimer <= 0) {
      state.enemyBuildTimer = preset.enemyBuildInterval + rand(-5, 8);
      enemyBuildDecision();
    }

    if (state.enemyResearchTimer <= 0) {
      state.enemyResearchTimer = preset.enemyResearchInterval + rand(-10, 12);
      enemyResearchDecision();
    }

    enemyProductionDecision(dt);
    enemyExpandOrAttack(dt);
  }

  function enemyAbilityScore(id) {
    return {
      barracks: 10,
      stable: 8,
      tower: 6,
      house: 9,
      quarry: 7,
      lumberCamp: 7,
      mint: 6,
      ironworks: 6,
      dojo: 8,
      formationAltar: 5,
      beacon: 4,
      skyCamp: 6,
      dock: 6,
      siegeWorkshop: 4,
      logistics: 4,
      factory: 9,
      mechYard: 8,
      lab: 8,
      modifyShop: 6,
      beastNest: 8,
      beastDen: 7,
      bloodPool: 7,
      boneTower: 6,
      waterPool: 7,
      fireForge: 7,
      earthAltar: 7,
      metalCourt: 7,
      woodGarden: 7,
      fusionAltar: 6,
      springRing: 4,
      rootTower: 6,
      hybridStable: 8,
      hybridLab: 7,
      hybridTower: 6
    }[id] || 1;
  }

  function enemyBuildDecision() {
    const preset = currentLevelPreset();
    const base = enemyMainBase();
    if (!base) return;
    const ownBuildings = enemyBuildings();
    const ownWorkers = enemyWorkers();
    const townLevel = state.enemyTownLevel || 1;
    const townUpgradeCost = townLevel === 1 ? { gold: 700, wood: 420, stone: 360, metal: 120 } : { gold: 1300, wood: 760, stone: 820, metal: 420 };
    if (townLevel < 3 && ownBuildings.filter((b) => b.type === "townCenter" || b.type === "fusionCore")[0] && hasCostForOwner("enemy", townUpgradeCost)) {
      payForOwner("enemy", townUpgradeCost);
      state.enemyTownLevel = Math.min(3, townLevel + 1);
      base.level = state.enemyTownLevel;
      addEntityBurst(base, "upgrade");
    }

    const buildable = Object.entries(BUILDINGS)
      .filter(([id, def]) => def.faction === "all" || def.faction === state.enemyFaction)
      .filter(([id]) => isBuildingAvailableForOwner(id, "enemy", Math.max(1, state.enemyTownLevel), state.enemyFaction))
      .filter(([id]) => enemyBuildingCount(id) < enemyDesiredBuildingCount(id))
      .filter(([id, def]) => !["townCenter", "fusionCore"].includes(id) || !ownBuildings.some((b) => b.type === id));

    const weighted = buildable
      .map(([id, def]) => ({ id, def, score: enemyAbilityScore(id) }))
      .sort((a, b) => b.score - a.score);

    const needsResource = [
      !ownBuildings.some((b) => b.type === "lumberCamp"),
      !ownBuildings.some((b) => b.type === "quarry"),
      !ownBuildings.some((b) => b.type === "mint") && state.enemyTownLevel >= 2,
      ownWorkers.length < 4
    ];

    let pick = null;
    if (needsResource[0]) pick = weighted.find((x) => x.id === "lumberCamp" || x.id === "woodGarden");
    if (!pick && needsResource[1]) pick = weighted.find((x) => x.id === "quarry" || x.id === "ironworks" || x.id === "metalCourt");
    if (!pick && needsResource[2]) pick = weighted.find((x) => x.id === "mint");
    if (!pick && needsResource[3]) pick = weighted.find((x) => x.id === "house");
    if (!pick) {
      if (base.queue.length < queueLimit(base)) {
        const trainables = factionUnitsForEnemy(base, state.enemyFaction).filter((id) => {
          const def = UNITS[id];
          return isUnitUnlockedForOwner(id, "enemy", state.enemyTechs, state.enemyFaction) && hasCostForOwner("enemy", def.cost);
        });
        if (trainables.length) {
          const choiceId = enemyChooseUnit(trainables);
          if (choiceId) {
            trainUnit(base, choiceId);
            return;
          }
        }
      }
      pick = weighted.find((x) => x.id === "barracks" || x.id === "mechYard" || x.id === "beastNest" || x.id === "waterPool" || x.id === "hybridStable" || x.id === "lab");
    }

    if (!pick) {
      if (base.queue.length < queueLimit(base)) {
        const trainables = factionUnitsForEnemy(base, state.enemyFaction);
        if (trainables.length) {
          const choiceId = enemyChooseUnit(trainables);
          if (choiceId) trainUnit(base, choiceId);
        }
      }
      return;
    }

    if (!hasCostForOwner("enemy", pick.def.cost)) return;
    const spot = enemyBuildSpot(base, pick.id);
    if (!spot) return;
    payForOwner("enemy", pick.def.cost);
    createBuilding(pick.id, "enemy", spot.x, spot.y, { built: false, level: pick.id === "townCenter" || pick.id === "fusionCore" ? Math.max(1, state.enemyTownLevel) : 1 });
    const workers = ownWorkers.length ? ownWorkers : enemyWorkers();
    for (const w of workers.slice(0, 3)) {
      w.moveTarget = { x: spot.x + rand(-55, 55), y: spot.y + rand(-55, 55) };
      w.order = "build";
    }
  }

  function enemyBuildingCount(type) {
    return enemyBuildings().filter((b) => b.type === type && !b.dead).length;
  }

  function enemyDesiredBuildingCount(type) {
    const preset = currentLevelPreset();
    const pressure = preset.enemyDifficulty >= 1 ? 1 : 0;
    const late = state.time > 240 ? 1 : 0;
    const map = {
      house: 3 + pressure + late,
      tower: 2 + pressure + late,
      barracks: 1 + pressure + late,
      stable: state.enemyTownLevel >= 2 ? 1 + late : 0,
      dojo: 1,
      lumberCamp: 1,
      quarry: 1,
      mint: state.enemyTownLevel >= 2 ? 1 : 0,
      ironworks: state.enemyTownLevel >= 2 ? 1 : 0,
      formationAltar: state.enemyTownLevel >= 2 ? 1 : 0,
      skyCamp: state.enemyTownLevel >= 2 && preset.enemyDifficulty >= 1 ? 1 : 0,
      siegeWorkshop: state.enemyTownLevel >= 3 || state.time > 360 ? 1 : 0,
      logistics: state.enemyTownLevel >= 2 ? 1 : 0
    };
    return map[type] ?? 1;
  }

  function enemyBuildSpot(base, type) {
    const offsets = {
      lumberCamp: { x: -330, y: -80 },
      quarry: { x: 260, y: 120 },
      mint: { x: 240, y: -140 },
      ironworks: { x: 300, y: 160 },
      barracks: { x: -240, y: 120 },
      stable: { x: 180, y: 140 },
      tower: { x: -120, y: -160 },
      house: { x: 200, y: 90 },
      dojo: { x: 70, y: 250 },
      formationAltar: { x: -80, y: 250 },
      beacon: { x: 120, y: -220 },
      skyCamp: { x: 240, y: -100 },
      dock: { x: -280, y: 210 },
      siegeWorkshop: { x: 280, y: 220 },
      logistics: { x: -160, y: 220 },
      factory: { x: 260, y: 160 },
      mechYard: { x: 220, y: -80 },
      lab: { x: -220, y: 110 },
      modifyShop: { x: -280, y: 160 },
      beastNest: { x: 210, y: -90 },
      beastDen: { x: 200, y: 150 },
      bloodPool: { x: -220, y: 90 },
      boneTower: { x: 20, y: -230 },
      waterPool: { x: -230, y: -80 },
      fireForge: { x: 230, y: -80 },
      earthAltar: { x: -220, y: 150 },
      metalCourt: { x: 220, y: 150 },
      woodGarden: { x: -220, y: 150 },
      fusionAltar: { x: 220, y: 170 },
      springRing: { x: 120, y: 200 },
      rootTower: { x: -120, y: 230 },
      hybridStable: { x: 220, y: -80 },
      hybridLab: { x: -220, y: 110 },
      hybridTower: { x: 70, y: -240 }
    }[type] || { x: rand(-320, 320), y: rand(-220, 240) };
    return findFreePoint(base.x + offsets.x, base.y + offsets.y);
  }

  function enemyChooseUnit(trainables) {
    const order = [
      "worker",
      "spearman",
      "archer",
      "lightCavalry",
      "warDog",
      "engineer",
      "shieldman",
      "antiAir",
      "crossbowElite",
      "guard",
      "mechDog",
      "lightMech",
      "heavyMech",
      "tank",
      "aaTruck",
      "motherBug",
      "burstBug",
      "stingerBug",
      "tigerBeast",
      "rainCaller",
      "fireSprite",
      "earthGuard",
      "metalFencer",
      "woodHealer",
      "musket",
      "arrayBot",
      "fiveElementSoldier",
      "beastCavalry"
    ];
    for (const id of order) if (trainables.includes(id)) return id;
    return trainables[0] || null;
  }

  function factionUnitsForEnemy(building, faction) {
    const b = BUILDINGS[building.type];
    return (b.canTrain || []).filter((id) => {
      const u = UNITS[id];
      if (!u) return false;
      if (u.faction !== "all" && u.faction !== faction) return false;
      return true;
    });
  }

  function enemyResearchDecision() {
    const preset = currentLevelPreset();
    const techPools = enemyTechPool();
    const available = techPools.filter((id) => !state.enemyTechs.has(id));
    if (!available.length) return;
    const tech = available
      .map((id) => ({ id, score: enemyTechScore(id) }))
      .sort((a, b) => b.score - a.score)[0];
    if (!tech) return;
    const base = enemyBuildings().find((b) => b.built && (BUILDINGS[b.type].canResearch || []).includes(tech.id));
    if (!base) {
      const provider = Object.entries(BUILDINGS).find(([, def]) => (def.canResearch || []).includes(tech.id) && (def.faction === "all" || def.faction === state.enemyFaction));
      if (provider && isBuildingAvailableForOwner(provider[0], "enemy", state.enemyTownLevel || 1, state.enemyFaction) && hasCostForOwner("enemy", provider[1].cost)) {
        const main = enemyMainBase();
        if (main) {
          const spot = enemyBuildSpot(main, provider[0]);
          payForOwner("enemy", provider[1].cost);
          createBuilding(provider[0], "enemy", spot.x, spot.y, { built: false });
        }
      }
      return;
    }
    if (!isTechAvailableForOwner(tech.id, "enemy", state.enemyTownLevel || 1, base.level || 1, state.enemyTechs)) return;
    if (!hasCostForOwner("enemy", TECHS[tech.id].cost)) return;
    if (base.researchQueue.length >= (base.level >= 3 ? 2 : 1)) return;
    payForOwner("enemy", TECHS[tech.id].cost);
    const speed = (preset.enemyBuildSpeed || 1) * (state.enemyModifiers.trainSpeed || 1);
    base.researchQueue.push({ tech: tech.id, remaining: TECHS[tech.id].time / speed, total: TECHS[tech.id].time / speed });
  }

  function enemyTechPool() {
    const faction = state.enemyFaction || "huaxia";
    const pools = {
      huaxia: ["spearWall", "shieldWall", "dogTraining", "engineerDecree", "swiftMarch", "veteranDrill", "royalGuard", "strongBow", "antiAirDrill", "fireArrow", "poisonArrow", "slowArrow", "pierceArrow", "crossbowCraft", "chargeDrill", "siegeAim"],
      jixie: ["turboPower", "highVoltage", "energyOverload", "tankChassis", "aaMissile", "fireControlAI", "autoRepairAI", "moduleSlots", "railStrike"],
      yaoshou: ["devourBoost", "bloodStorage", "bloodRage", "toxicGland", "boneArmor", "beastTide"],
      ziran: ["elementResonance", "dualFusion", "fusionStable", "weatherCycle"],
      ronghe: ["fusionExpand", "fusionSupply", "supplyLink", "hybridDrill", "routeMastery"]
    };
    return pools[faction] || pools.huaxia;
  }

  function enemyTechScore(id) {
    return {
      spearWall: 8,
      shieldWall: 8,
      dogTraining: 4,
      engineerDecree: 4,
      swiftMarch: 5,
      veteranDrill: 4,
      royalGuard: 7,
      strongBow: 8,
      antiAirDrill: 7,
      fireArrow: 8,
      poisonArrow: 7,
      slowArrow: 6,
      pierceArrow: 7,
      crossbowCraft: 7,
      chargeDrill: 6,
      siegeAim: 8,
      turboPower: 7,
      highVoltage: 8,
      energyOverload: 9,
      tankChassis: 8,
      aaMissile: 7,
      fireControlAI: 9,
      autoRepairAI: 8,
      moduleSlots: 6,
      railStrike: 10,
      devourBoost: 8,
      bloodStorage: 6,
      bloodRage: 8,
      toxicGland: 7,
      boneArmor: 8,
      beastTide: 10,
      elementResonance: 8,
      dualFusion: 9,
      fusionStable: 7,
      weatherCycle: 9,
      fusionExpand: 7,
      fusionSupply: 7,
      supplyLink: 6,
      hybridDrill: 7,
      routeMastery: 8
    }[id] || 1;
  }

  function enemyProductionDecision(dt) {
    const preset = currentLevelPreset();
    for (const b of enemyBuildings()) {
      if (!b.built) continue;
      if (BUILDINGS[b.type].canTrain?.length && b.queue.length < queueLimit(b)) {
        const available = factionUnitsForEnemy(b, state.enemyFaction).filter((id) => isUnitUnlockedForOwner(id, "enemy", state.enemyTechs, state.enemyFaction));
        if (!available.length) continue;
        if (Math.random() > 0.28 * dt * 60) continue;
        const choiceId = enemyChooseUnit(available);
        if (choiceId && hasCostForOwner("enemy", UNITS[choiceId].cost)) trainUnit(b, choiceId);
      }
    }
  }

  function enemyExpandOrAttack(dt) {
    const preset = currentLevelPreset();
    const main = getMainBase();
    if (!main) return;
    const aggression = preset.enemyAggression || 1;
    for (const u of enemyUnits()) {
      if (u.order === "idle" || u.order === "gather") {
        const d = distXY(u.x, u.y, main.x, main.y);
        if (d < 1200 * aggression || state.time > 110 / aggression) {
          u.moveTarget = { x: main.x + rand(-150, 150), y: main.y + rand(-150, 150) };
          u.order = "attackMove";
        }
      }
    }
  }

  function isNearPoweredNode(b) {
    const range = hasTech("highVoltage") ? 504 : 420;
    return playerBuildings().some((p) => {
      const d = BUILDINGS[p.type];
      return p.built && (d.powerGen || d.powerRange) && distXY(b.x, b.y, p.x, p.y) <= range;
    });
  }

  function autoGather(u, dt) {
    if (u.order !== "idle" && u.order !== "gather") return;
    const previousTarget = u.gatherTarget;
    let node = u.gatherTarget && state.resourcesNodes.find((n) => n.id === u.gatherTarget && n.amount > 0);
    if (!node) {
      node = nearestResource(u);
      if (node) u.gatherTarget = node.id;
    }
    if (!node) return;
    if (u.owner === "player" && previousTarget !== node.id) {
      createDecal(node.x, node.y, node.r + 18, "gather", 0.9, "player");
      bubble(u, `采集${RES[node.type].name}`, "normal");
    }
    u.order = "gather";
    const d = distXY(u.x, u.y, node.x, node.y);
    if (d > node.r + u.r + 12) {
      moveToward(u, node.x, node.y, dt, 0.7);
    } else {
      const faction = u.owner === "enemy" ? state.enemyFaction : state.faction;
      const rateBase = faction === "jixie" && u.type.includes("machine") ? 1.45 : faction === "yaoshou" ? 1.2 : 1;
      const rate = rateBase
        * (node.type === "wood" && hasNearbyBuildingForOwner(u.owner, "lumberCamp", node.x, node.y) ? 1.25 : 1)
        * (node.type === "stone" && hasNearbyBuildingForOwner(u.owner, "quarry", node.x, node.y) ? 1.2 : 1)
        * (u.owner === "enemy" ? (currentLevelPreset().enemyIncomeMultiplier || 1) : 1);
      const amount = 0.9 * rate * dt;
      node.amount = Math.max(0, node.amount - amount);
      resourceBagForOwner(u.owner)[node.type] = (resourceBagForOwner(u.owner)[node.type] || 0) + amount;
      incomeBagForOwner(u.owner)[node.type] = (incomeBagForOwner(u.owner)[node.type] || 0) + amount * 3600;
      markFx(u, "gather", 0.25);
      if (Math.random() < dt * 1.35) addBeam(u.x, u.y - u.r * 0.5, node.x + rand(-node.r * 0.35, node.r * 0.35), node.y + rand(-node.r * 0.25, node.r * 0.25), RES[node.type].color, 0.18, 1.6);
      if (Math.random() < dt * 1.1) addParticle(u.x + rand(-u.r, u.r), u.y + rand(-u.r, u.r), RES[node.type].color, 1, 2);
      if (Math.random() < dt * 0.8) addParticle(node.x + rand(-node.r, node.r), node.y + rand(-node.r, node.r), RES[node.type].color, 1, 2);
      if (u.owner === "player" && Math.random() < dt * 0.08) floating(u.x, u.y - u.r - 10, `+${RES[node.type].short}`, "resource");
    }
  }

  function nearestResource(u) {
    let best = null;
    let bestD = Infinity;
    for (const n of state.resourcesNodes) {
      if (n.amount <= 0) continue;
      const d = distXY(u.x, u.y, n.x, n.y);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  function hasNearbyBuilding(type, x, y) {
    return playerBuildings().some((b) => b.type === type && b.built && distXY(b.x, b.y, x, y) < 360);
  }

  function hasNearbyBuildingForOwner(owner, type, x, y) {
    return buildingsForOwner(owner).some((b) => b.type === type && b.built && distXY(b.x, b.y, x, y) < 360);
  }

  function updateBuildProgress(dt) {
    for (const b of state.buildings) {
      if (b.dead || b.built) continue;
      const workerList = state.units.filter((u) => u.owner === b.owner && !u.dead && UNITS[u.type].tags?.includes("worker") && distXY(u.x, u.y, b.x, b.y) < 120);
      const workers = workerList.length;
      const ownerSpeed = b.owner === "enemy" ? currentLevelPreset().enemyBuildSpeed || 1 : 1;
      const speed = (1 + Math.min(3, workers) * 0.45) * ownerSpeed;
      b.buildRemaining -= dt * speed;
      if (workers > 0) {
        markFx(b, "buildPulse", 0.35);
        for (const w of workerList.slice(0, 3)) markFx(w, "order", 0.25);
        if (Math.random() < dt * 2.4) addParticle(b.x + rand(-b.r, b.r), b.y + rand(-b.r * 0.7, b.r * 0.7), "#ffd578", 1, 3);
        if (workerList[0] && Math.random() < dt * 0.7) addBeam(workerList[0].x, workerList[0].y - workerList[0].r * 0.4, b.x + rand(-b.r * 0.35, b.r * 0.35), b.y + rand(-b.r * 0.2, b.r * 0.2), "#ffd578", 0.16, 1.5);
      }
      if (b.buildRemaining <= 0) {
        b.built = true;
        b.buildRemaining = 0;
        addEntityBurst(b, "complete");
        if (b.owner === "player") {
          toast(`${BUILDINGS[b.type].name} 建造完成`);
          bubble(b, "建造完成", "ok");
          state.needsUi = true;
        }
      }
    }
  }

  function updateQueues(dt) {
    for (const b of state.buildings) {
      if (b.dead || !b.built) continue;
      const def = BUILDINGS[b.type];
      const prodMult = queueSpeedForBuilding(b);
      if (b.queue.length) {
        const item = b.queue[0];
        item.remaining -= dt * prodMult;
        if (item.remaining <= 0) {
          b.queue.shift();
          spawnProducedUnit(b, item.unit);
          if (b.owner === "player") {
            toast(`${UNITS[item.unit].name} 训练完成`);
            state.needsUi = true;
          }
        }
      }
      if (b.researchQueue.length) {
        const item = b.researchQueue[0];
        item.remaining -= dt * prodMult;
        if (item.remaining <= 0) {
          b.researchQueue.shift();
          completeTech(item.tech, b.owner);
        }
      }
      if (def.attack && b.cooldown > 0) b.cooldown -= dt;
      if (b.overloaded > 0) b.overloaded -= dt;
      for (const k of Object.keys(b.abilityCooldowns)) b.abilityCooldowns[k] = Math.max(0, b.abilityCooldowns[k] - dt);
    }
  }

  function queueSpeedForBuilding(b) {
    let m = 1;
    if (b.level >= 2) m *= 1.15;
    if (b.overloaded > 0) m *= b.owner === "player" && state.faction === "jixie" ? 1.35 : 1.2;
    if (b.owner === "player" && state.faction === "jixie" && !b.powered) m *= 0.5;
    if (ownerHasTech(b.owner, "cavalryTrain") && BUILDINGS[b.type].canTrain?.some((id) => UNITS[id]?.tags?.includes("cavalry"))) m *= 1.1;
    if (ownerHasTech(b.owner, "hybridDrill") && (b.owner === "player" ? state.faction === "ronghe" : state.enemyFaction === "ronghe")) m *= 1.1;
    if (ownerHasTech(b.owner, "fusionStable") && BUILDINGS[b.type].abilities?.includes("fusion")) m *= 1.15;
    if (b.owner === "enemy") m *= (currentLevelPreset().enemyBuildSpeed || 1) * (state.enemyModifiers.trainSpeed || 1);
    return m;
  }

  function spawnProducedUnit(b, unitType) {
    const def = UNITS[unitType];
    const rally = b.rally || { x: b.x + 120, y: b.y };
    const spawn = findFreePoint(b.x + rand(-40, 40), b.y + b.r + 36);
    const u = createUnit(unitType, b.owner, spawn.x, spawn.y, { rallyFrom: b.id, spawnFx: 0.75 });
    if (b.level >= 3) u.exp += 20;
    if (ownerHasTech(b.owner, "veteranDrill") && def.tags?.includes("infantry")) u.exp += 8;
    u.moveTarget = { x: rally.x + rand(-28, 28), y: rally.y + rand(-28, 28) };
    u.order = "move";
    addEntityBurst(u, "spawn");
    addBeam(b.x, b.y, u.x, u.y, b.owner === "enemy" ? "#d45a48" : "#68a9ff", 0.22, 2);
    if (b.owner === "player") bubble(u, "出阵", "ok");
  }

  function findFreePoint(x, y) {
    return { x: clamp(x, 80, WORLD_W - 80), y: clamp(y, 80, WORLD_H - 80) };
  }

  function completeTech(id, owner) {
    if (owner === "enemy") {
      state.enemyTechs.add(id);
      applyEnemyTechEffect(id);
      return;
    }
    state.researched.add(id);
    const t = TECHS[id];
    if (t.arrow) state.unlockedArrowModes.add(t.arrow);
    if (t.unlockUnits) t.unlockUnits.forEach((u) => {});
    addEntityBurst(getMainBase(), "upgrade");
    toast(`${t.name} 研究完成`);
    bubble(getMainBase(), "科技完成", "ok");
    state.needsUi = true;
  }

  function applyEnemyTechEffect(id) {
    const effects = {
      strongBow: () => { state.enemyModifiers.range *= 1.05; state.enemyModifiers.damage *= 1.03; },
      fireArrow: () => { state.enemyModifiers.damage *= 1.04; },
      pierceArrow: () => { state.enemyModifiers.damage *= 1.05; },
      swiftMarch: () => { state.enemyModifiers.trainSpeed *= 1.03; },
      chargeDrill: () => { state.enemyModifiers.trainSpeed *= 1.05; },
      siegeAim: () => { state.enemyModifiers.damage *= 1.05; },
      turboPower: () => { state.enemyModifiers.trainSpeed *= 1.05; },
      fireControlAI: () => { state.enemyModifiers.damage *= 1.05; },
      energyOverload: () => { state.enemyModifiers.trainSpeed *= 1.05; },
      devourBoost: () => { state.enemyModifiers.damage *= 1.04; },
      boneArmor: () => { state.enemyModifiers.damage *= 1.03; },
      bloodRage: () => { state.enemyModifiers.damage *= 1.05; },
      fusionStable: () => { state.enemyModifiers.trainSpeed *= 1.06; },
      hybridDrill: () => { state.enemyModifiers.trainSpeed *= 1.06; }
    };
    effects[id]?.();
  }

  function updateUnits(dt) {
    for (const u of state.units) {
      if (u.dead) continue;
      const def = UNITS[u.type];
      for (const k of Object.keys(u.abilityCooldowns)) u.abilityCooldowns[k] = Math.max(0, u.abilityCooldowns[k] - dt);
      updateStatuses(u, dt);
      updateSupport(u, dt);
      if (u.cooldown > 0) u.cooldown -= dt;
      if (u.hp <= 0) {
        killUnit(u);
        continue;
      }
      if (u.order === "dead") continue;
      let target = u.targetId ? objectById(u.targetId) : null;
      if (!target || target.dead || target.owner === u.owner) {
        target = findAutoTarget(u);
        u.targetId = target?.id || null;
      }
      if (target && canAttack(u, target)) {
        const d = distXY(u.x, u.y, target.x, target.y);
        const range = getUnitRange(u);
        if (d > range) {
          if (!def.tags?.includes("siege") || u.order === "attack" || d < range * 1.35) moveToward(u, target.x, target.y, dt, 1);
        } else {
          u.order = "attack";
          attackUnit(u, target);
        }
      } else if (u.order === "build") {
        const site = nearestUnbuiltBuilding(u);
        if (site) {
          if (distXY(u.x, u.y, site.x, site.y) > site.r + u.r + 42) {
            moveToward(u, site.x, site.y, dt, 0.9);
          } else {
            u.moveTarget = null;
          }
        } else {
          u.order = "idle";
        }
      } else if (u.moveTarget) {
        moveToward(u, u.moveTarget.x + u.pathOffset.x, u.moveTarget.y + u.pathOffset.y, dt, 1);
        if (distXY(u.x, u.y, u.moveTarget.x + u.pathOffset.x, u.moveTarget.y + u.pathOffset.y) < 12) {
          u.moveTarget = null;
          u.order = "idle";
        }
      } else if (u.owner === "enemy") {
        enemyIdleBehavior(u, dt);
      }
      avoidOverlap(u, dt);
    }
    state.units = state.units.filter((u) => !u.remove);
  }

  function nearestUnbuiltBuilding(u) {
    let best = null;
    let bestD = Infinity;
    for (const b of state.buildings) {
      if (b.owner !== u.owner || b.dead || b.built) continue;
      const d = distXY(u.x, u.y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  function updateStatuses(u, dt) {
    u.status = u.status.filter((s) => {
      s.ttl -= dt;
      if (s.kind === "burn") {
        s.tick = (s.tick || 0) - dt;
        if (s.tick <= 0) {
          s.tick = 0.5;
          dealDamage(s.source || null, u, s.power || 4, "fire", { dot: true });
        }
      }
      if (s.kind === "poison") {
        s.tick = (s.tick || 0) - dt;
        if (s.tick <= 0) {
          s.tick = 0.7;
          dealDamage(s.source || null, u, s.power || 3, "poison", { dot: true });
        }
      }
      return s.ttl > 0;
    });
  }

  function updateSupport(u, dt) {
    const def = UNITS[u.type];
    if (def.abilities?.includes("heal")) {
      const ally = state.units.find((a) => a.owner === u.owner && !a.dead && a.hp < a.maxHp * 0.94 && distXY(u.x, u.y, a.x, a.y) < 220);
      if (ally && (u.abilityCooldowns.heal || 0) <= 0) {
        const amount = def.element === "wood" ? 42 : 34;
        ally.hp = Math.min(ally.maxHp, ally.hp + amount);
        floating(ally.x, ally.y - 20, `+${amount}`, "heal");
        markFx(ally, "hitFlash", 0.18);
        addBeam(u.x, u.y - u.r, ally.x, ally.y - ally.r, "#79df7a", 0.22, 2);
        addParticle(ally.x, ally.y, "#79df7a", 6, 3);
        u.abilityCooldowns.heal = 2.5;
        if (Math.random() < 0.7) bubble(u, def.element === "wood" ? "莲华净化" : "包扎", "heal");
      }
    }
    if (def.abilities?.includes("repair")) {
      const repairTarget = [
        ...state.buildings.filter((b) => b.owner === u.owner && !b.dead && b.hp < b.maxHp * 0.96 && distXY(u.x, u.y, b.x, b.y) < 210),
        ...state.units.filter((a) => a.owner === u.owner && a.id !== u.id && !a.dead && a.hp < a.maxHp * 0.96 && (UNITS[a.type].tags?.includes("mechanical") || UNITS[a.type].tags?.includes("ship")) && distXY(u.x, u.y, a.x, a.y) < 190)
      ].sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
      if (repairTarget && (u.abilityCooldowns.repair || 0) <= 0) {
        const amount = repairTarget.kind === "building" ? 46 : 34;
        repairTarget.hp = Math.min(repairTarget.maxHp, repairTarget.hp + amount);
        floating(repairTarget.x, repairTarget.y - repairTarget.r, `+${amount}`, "repair");
        markFx(repairTarget, "hitFlash", 0.18);
        addBeam(u.x, u.y - u.r * 0.5, repairTarget.x, repairTarget.y - repairTarget.r * 0.4, "#8bd1ff", 0.22, 2);
        addParticle(repairTarget.x, repairTarget.y, "#8bd1ff", 7, 3);
        u.abilityCooldowns.repair = 2.2;
        if (Math.random() < 0.55) bubble(u, "修复", "heal");
      }
    }
    if (def.abilities?.includes("supplyAura") || def.abilities?.includes("inspire")) {
      for (const a of state.units) {
        if (a.owner === u.owner && a.id !== u.id && distXY(u.x, u.y, a.x, a.y) < 180) {
          applyStatus(a, def.abilities.includes("inspire") ? "inspired" : "supplied", 1.2, u.id, 1);
        }
      }
    }
  }

  function moveToward(u, tx, ty, dt, mult) {
    const def = UNITS[u.type];
    const d = distXY(u.x, u.y, tx, ty);
    if (d < 1) return;
    let speed = getUnitSpeed(u) * mult;
    const terrain = getTerrainAt(u.x, u.y);
    if (def.waterOnly && terrain !== "water") speed *= 0.35;
    if (def.element && terrainElement(terrain) === def.element) speed *= def.element === "water" ? 1.3 : 1.08;
    if (u.status.some((s) => s.kind === "slow")) speed *= 0.65;
    if (u.status.some((s) => s.kind === "shieldAdvance")) speed *= 0.65;
    const step = Math.min(d, speed * dt);
    u.x += ((tx - u.x) / d) * step;
    u.y += ((ty - u.y) / d) * step;
    u.x = clamp(u.x, 20, WORLD_W - 20);
    u.y = clamp(u.y, 20, WORLD_H - 20);
  }

  function avoidOverlap(u, dt) {
    const near = state.units.filter((o) => o !== u && !o.dead && distXY(u.x, u.y, o.x, o.y) < u.r + o.r + 2);
    for (const o of near.slice(0, 5)) {
      const dx = u.x - o.x;
      const dy = u.y - o.y;
      const d = Math.max(0.1, Math.hypot(dx, dy));
      const push = (u.r + o.r + 2 - d) * 0.5;
      u.x += (dx / d) * push * dt * 8;
      u.y += (dy / d) * push * dt * 8;
    }
  }

  function getUnitSpeed(u) {
    const def = UNITS[u.type];
    let s = def.speed;
    if (u.status.some((x) => x.kind === "overload")) s *= 1.25;
    if (u.status.some((x) => x.kind === "swift")) s *= 1.35;
    if (ownerHasTech(u.owner, "swiftMarch") && def.tags?.includes("infantry")) s *= 1.04;
    if (ownerHasTech(u.owner, "shipHull") && def.tags?.includes("ship")) s *= 0.97;
    if (hasTech("snakeFormation") && state.activeFormation === "snake" && u.owner === "player") s *= 1.08;
    return s;
  }

  function getUnitRange(u) {
    let r = UNITS[u.type].range || 0;
    if (ownerHasTech(u.owner, "strongBow") && UNITS[u.type].tags?.includes("archer")) r += 25;
    if (u.status.some((x) => x.kind === "overload") && UNITS[u.type].tags?.includes("ship")) r += 25;
    if (u.owner === "enemy") r *= state.enemyModifiers.range || 1;
    return r;
  }

  function findAutoTarget(u) {
    const enemies = [
      ...state.units.filter((e) => e.owner !== u.owner && !e.dead),
      ...state.buildings.filter((e) => e.owner !== u.owner && !e.dead && e.built)
    ];
    const def = UNITS[u.type];
    let best = null;
    let bestScore = -Infinity;
    for (const e of enemies) {
      if (!canAttack(u, e)) continue;
      const d = distXY(u.x, u.y, e.x, e.y);
      const scan = Math.max(def.sight || 420, getUnitRange(u) + 70);
      if (d > scan) continue;
      let score = 1000 - d;
      const tags = entityTags(e);
      if (def.counters?.some((c) => tags.includes(c))) score += 450;
      if (ownerHasTech(u.owner, "fireControlAI")) score += def.counters?.some((c) => tags.includes(c)) ? 300 : 0;
      if (e.kind === "unit" && e.hp < e.maxHp * 0.3) score += 120;
      if (score > bestScore) {
        best = e;
        bestScore = score;
      }
    }
    return best;
  }

  function canAttack(attacker, target) {
    if (!attacker || !target || target.dead) return false;
    const def = UNITS[attacker.type];
    if (!def || (def.damage?.[1] || 0) <= 0) return false;
    if (target.kind === "unit" && UNITS[target.type].tags?.includes("flying")) {
      return def.tags?.includes("antiAir") || def.tags?.includes("flying") || def.range > 260 || def.abilities?.includes("lockOn");
    }
    if (def.waterOnly && getTerrainAt(attacker.x, attacker.y) !== "water") return false;
    return true;
  }

  function attackUnit(u, target) {
    const def = UNITS[u.type];
    const cd = 1 / Math.max(0.1, getAttackSpeed(u));
    if (u.cooldown > 0) return;
    u.cooldown = cd;
    const range = getUnitRange(u);
    const type = attackTypeFor(u);
    if (range > 90) {
      state.projectiles.push({
        id: uid(),
        owner: u.owner,
        source: u.id,
        target: target.id,
        x: u.x,
        y: u.y,
        speed: projectileSpeed(type),
        damage: rollDamage(u),
        damageType: type,
        ttl: 3,
        radius: def.tags?.includes("aoe") ? 70 : 0
      });
    } else {
      dealDamage(u, target, rollDamage(u), type);
      addParticle(target.x, target.y, colorForDamage(type), 5, 3);
    }
    maybeTriggerAbility(u, target);
  }

  function getAttackSpeed(u) {
    const def = UNITS[u.type];
    let s = def.attackSpeed || 0;
    if (u.status.some((x) => x.kind === "overload")) s *= 1.25;
    if (u.status.some((x) => x.kind === "inspired")) s *= 1.08;
    if (state.activeFormation === "arrow" && u.owner === "player" && !def.tags?.includes("ranged")) s *= 1.04;
    if (state.activeArrow === "fire" && def.tags?.includes("archer")) s *= 0.9;
    if (state.activeArrow === "pierce" && def.tags?.includes("archer")) s *= 0.8;
    return s;
  }

  function attackTypeFor(u) {
    const def = UNITS[u.type];
    if (def.element) return def.element;
    if (def.tags?.includes("fire")) return "fire";
    if (def.tags?.includes("pierce")) return "pierce";
    if (def.tags?.includes("siege")) return "siege";
    if (def.tags?.includes("antiAir")) return "pierce";
    if (def.tags?.includes("archer")) {
      if (u.owner === "player" && state.activeArrow !== "normal") return state.activeArrow;
      return "arrow";
    }
    if (def.tags?.includes("mechanical")) return "metal";
    if (def.tags?.includes("beast")) return "physical";
    return "physical";
  }

  function projectileSpeed(type) {
    if (type === "siege") return 340;
    if (type === "fire") return 480;
    if (type === "arrow" || type === "pierce") return 640;
    return 540;
  }

  function rollDamage(u) {
    const def = UNITS[u.type];
    let dmg = rand(def.damage[0], def.damage[1]);
    const starMul = [1, 1.06, 1.12, 1.2, 1.3][u.star - 1] || 1;
    dmg *= starMul;
    if (ownerHasTech(u.owner, "strongBow") && def.tags?.includes("archer")) dmg *= 1.05;
    if (ownerHasTech(u.owner, "shipHull") && def.tags?.includes("ship")) dmg *= 1.02;
    if (ownerHasTech(u.owner, "boneArmor") && def.tags?.includes("beast") && def.tags?.includes("heavy")) dmg *= 1.05;
    if (ownerHasTech(u.owner, "devourBoost") && def.tags?.includes("beast")) dmg *= 1 + (u.devour || 0) * 0.02;
    if (u.status.some((x) => x.kind === "overload")) dmg *= 1.18;
    if (u.status.some((x) => x.kind === "inspired")) dmg *= 1.08;
    if (state.activeFormation === "arrow" && u.owner === "player" && !def.tags?.includes("ranged")) dmg *= 1.08;
    if (state.activeFormation === "defense" && u.owner === "player" && def.tags?.includes("infantry")) dmg *= 0.97;
    if (state.faction === "ziran" && def.element && terrainElement(getTerrainAt(u.x, u.y)) === def.element) dmg *= elementTerrainAttack(def.element);
    if (u.owner === "enemy") dmg *= (currentLevelPreset().enemyDamageScale || 1) * (state.enemyModifiers.damage || 1);
    return dmg;
  }

  function elementTerrainAttack(element) {
    if (element === "water") return 1.25;
    if (element === "fire") return 1.12;
    if (element === "metal") return 1.08;
    return 1.06;
  }

  function maybeTriggerAbility(u, target) {
    const def = UNITS[u.type];
    if (def.abilities?.includes("spearWall") && ownerHasTech(u.owner, "spearWall")) {
      if (!u.moveTarget && Math.random() < 0.08) {
        bubble(u, "拒马枪阵", "defense");
        applyStatus(u, "spearWall", 2.5, u.id, 1);
      }
    }
    if (def.abilities?.includes("charge") && (u.abilityCooldowns.charge || 0) <= 0 && distXY(u.x, u.y, target.x, target.y) > 40) {
      bubble(u, "突袭冲锋", "attack");
      applyStatus(u, "charge", 2, u.id, 1);
      u.abilityCooldowns.charge = 9;
    }
    if (def.abilities?.includes("selfDetonate") && distXY(u.x, u.y, target.x, target.y) < 60) {
      bubble(u, "定向爆裂", "attack");
      explodeAt(u.x, u.y, 110, 95, u.owner, "explosion", u);
      killUnit(u, true);
    }
    if (def.abilities?.includes("devour") && target.hp <= 0 && Math.random() < 0.35) {
      u.devour = Math.min(8, (u.devour || 0) + 1);
      u.maxHp += ownerHasTech(u.owner, "devourBoost") ? 14 : 10;
      u.hp = Math.min(u.maxHp, u.hp + 60);
      bubble(u, "吞噬", "heal");
      state.resources.blood += 4;
    }
    if (def.abilities?.includes("flameBurst") && (u.abilityCooldowns.flameBurst || 0) <= 0 && Math.random() < 0.08) {
      bubble(u, "烈焰爆发", "attack");
      explodeAt(u.x, u.y, 110, 42, u.owner, "fire", u);
      u.abilityCooldowns.flameBurst = 8;
    }
    if (def.abilities?.includes("mudField") && (u.abilityCooldowns.mudField || 0) <= 0 && Math.random() < 0.06) {
      bubble(u, "泥沼陷落", "control");
      createDecal(target.x, target.y, 145, "mud", 7, u.owner);
      u.abilityCooldowns.mudField = 10;
    }
    if (def.abilities?.includes("railCannon") && (u.abilityCooldowns.railCannon || 0) <= 0 && Math.random() < 0.05) {
      bubble(u, "五相能量炮", "ultimate");
      lineBlast(u, target, 180, "electric");
      u.abilityCooldowns.railCannon = 14;
    }
  }

  function applyStatus(entity, kind, ttl, source, power = 1) {
    const old = entity.status?.find((s) => s.kind === kind);
    if (old) {
      old.ttl = Math.max(old.ttl, ttl);
      old.power = Math.max(old.power || 1, power);
    } else {
      entity.status = entity.status || [];
      entity.status.push({ kind, ttl, source, power });
    }
  }

  function updateBuildingsCombat(dt) {
    for (const b of state.buildings) {
      if (b.dead || !b.built) continue;
      const def = BUILDINGS[b.type];
      if (!def.attack || b.cooldown > 0 || (state.faction === "jixie" && b.owner === "player" && !b.powered)) continue;
      const targets = state.units.filter((u) => u.owner !== b.owner && !u.dead && distXY(b.x, b.y, u.x, u.y) < def.attack.range);
      if (!targets.length) continue;
      const target = targets.sort((a, z) => distXY(b.x, b.y, a.x, a.y) - distXY(b.x, b.y, z.x, z.y))[0];
      b.cooldown = def.attack.cooldown / (b.overloaded > 0 ? 1.5 : 1);
      const ownerScale = b.owner === "enemy" ? (currentLevelPreset().enemyDamageScale || 1) * (state.enemyModifiers.damage || 1) : 1;
      state.projectiles.push({
        id: uid(),
        owner: b.owner,
        source: b.id,
        target: target.id,
        x: b.x,
        y: b.y - 24,
        speed: 620,
        damage: rand(def.attack.damage[0], def.attack.damage[1]) * (b.level > 1 ? 1 + b.level * 0.12 : 1) * ownerScale,
        damageType: def.attack.type,
        ttl: 2,
        radius: def.attack.type === "poison" ? 34 : 0
      });
    }
  }

  function updateProjectiles(dt) {
    for (const p of state.projectiles) {
      p.ttl -= dt;
      const target = objectById(p.target);
      if (!target || target.dead || p.ttl <= 0) {
        p.dead = true;
        continue;
      }
      const d = distXY(p.x, p.y, target.x, target.y);
      const step = p.speed * dt;
      if (d <= step + target.r) {
        p.dead = true;
        if (p.radius) explodeAt(target.x, target.y, p.radius, p.damage, p.owner, p.damageType, objectById(p.source));
        else dealDamage(objectById(p.source), target, p.damage, p.damageType);
        addParticle(target.x, target.y, colorForDamage(p.damageType), 8, 3);
      } else {
        p.x += ((target.x - p.x) / d) * step;
        p.y += ((target.y - p.y) / d) * step;
      }
    }
    state.projectiles = state.projectiles.filter((p) => !p.dead);
  }

  function updateParticles(dt) {
    for (const beam of state.beams) beam.ttl -= dt;
    state.beams = state.beams.filter((beam) => beam.ttl > 0);
    for (const e of [...state.units, ...state.buildings]) {
      if (!e.fx) continue;
      for (const key of Object.keys(e.fx)) e.fx[key] = Math.max(0, e.fx[key] - dt);
    }
    for (const p of state.particles) {
      p.ttl -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    state.particles = state.particles.filter((p) => p.ttl > 0);
    for (const f of state.floaters) {
      f.ttl -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
    }
    state.floaters = state.floaters.filter((f) => f.ttl > 0);
    for (const b of state.bubbles) {
      b.ttl -= dt;
      const owner = objectById(b.owner);
      if (owner) {
        b.x = owner.x;
        b.y = owner.y - owner.r - 26;
      }
    }
    state.bubbles = state.bubbles.filter((b) => b.ttl > 0);
    for (const d of state.decals) {
      d.ttl -= dt;
      if (d.kind === "mud") {
        for (const u of state.units) {
          if (u.owner !== d.owner && !u.dead && distXY(u.x, u.y, d.x, d.y) < d.r) applyStatus(u, "slow", 0.6, d.owner, 1);
        }
      }
      if (d.kind === "fire") {
        for (const u of state.units) {
          if (u.owner !== d.owner && !u.dead && distXY(u.x, u.y, d.x, d.y) < d.r) applyStatus(u, "burn", 0.9, d.owner, 5);
        }
      }
    }
    state.decals = state.decals.filter((d) => d.ttl > 0);
  }

  function dealDamage(source, target, rawDamage, type, opts = {}) {
    if (!target || target.dead) return;
    const tags = entityTags(target);
    let dmg = rawDamage;
    const armor = Math.max(0, (target.armor || 0) - (type === "pierce" || type === "metal" ? 1 : 0));
    dmg = Math.max(1, dmg - armor * (type === "siege" ? 1.4 : 2.2));
    if (source) {
      const sourceTags = source.kind === "unit" ? UNITS[source.type].counters || [] : [];
      if (sourceTags.some((c) => tags.includes(c))) {
        dmg *= 1.25;
        opts.counter = true;
      }
      const sDef = source.kind === "unit" ? UNITS[source.type] : null;
      if (sDef?.element && target.kind === "unit") {
        const tDef = UNITS[target.type];
        if (tDef?.element && ELEMENT_BEATS[sDef.element]?.includes(tDef.element)) {
          dmg *= 1.28;
          opts.counter = true;
        }
      }
    }
    if (target.status?.some((s) => s.kind === "shieldAdvance") && (type === "arrow" || type === "pierce")) dmg *= 0.55;
    if (target.status?.some((s) => s.kind === "spearWall") && type === "charge") dmg *= 0.6;
    const crit = !opts.dot && Math.random() < 0.06 + (type === "pierce" ? 0.03 : 0);
    if (crit) dmg *= 1.6;
    dmg = Math.round(dmg);
    target.hp -= dmg;
    if (!opts.dot) {
      markFx(target, "hitFlash", 0.22);
      createDecal(target.x, target.y, target.r + 8, "hit", 0.24, source?.owner || null);
      addParticle(target.x, target.y, colorForDamage(type), Math.min(10, 3 + Math.ceil(dmg / 60)), type === "siege" ? 4 : 3);
    }
    const labelType = crit ? "crit" : opts.counter ? "counter" : type;
    floating(target.x, target.y - target.r, `${crit ? "暴 " : ""}${dmg}`, labelType);
    if (target.hp <= 0) {
      target.hp = 0;
      if (target.kind === "unit") killUnit(target);
      else killBuilding(target);
      if (source?.kind === "unit") grantExp(source, target);
    }
    if (type === "fire" || type === "fireArrow") applyStatus(target, "burn", 3, source?.id, 4);
    if (type === "poison") applyStatus(target, "poison", 4, source?.id, 3);
    if (type === "slow") applyStatus(target, "slow", 2, source?.id, 1);
    if (type === "pierce") applyStatus(target, "armorBreak", 3, source?.id, 1);
  }

  function entityTags(e) {
    if (e.kind === "building") return ["building", BUILDINGS[e.type].category?.toLowerCase() || ""];
    return UNITS[e.type].tags || [];
  }

  function grantExp(source, target) {
    if (!source || source.owner !== "player") return;
    const gain = target.kind === "building" ? 25 : UNITS[target.type].tags?.includes("elite") ? 30 : 10;
    source.exp += gain;
    state.exp += gain;
    const next = [0, 40, 100, 220, 420][source.star] || Infinity;
    if (source.exp >= next && source.star < 5) {
      source.star += 1;
      source.maxHp = scaleHp(UNITS[source.type].hp, source.star);
      source.hp = source.maxHp;
      source.armor = scaleArmor(UNITS[source.type].armor || 0, source.star);
      bubble(source, `${source.star}星晋升`, "ok");
      floating(source.x, source.y - source.r - 12, `${source.star}星`, "heal");
    }
  }

  function killUnit(u, silent = false) {
    if (u.dead) return;
    u.dead = true;
    u.order = "dead";
    u.remove = true;
    addParticle(u.x, u.y, u.owner === "player" ? "#4f78c7" : "#bd4738", 18, 4);
    if (!silent && UNITS[u.type].tags?.includes("mechanical") && Math.random() < 0.35) {
      createDecal(u.x, u.y, 40, "wreck", 45, null);
    }
    state.selected = state.selected.filter((id) => id !== u.id);
    state.needsUi = true;
    state.needsMini = true;
  }

  function killBuilding(b) {
    if (b.dead) return;
    b.dead = true;
    addParticle(b.x, b.y, "#d67a3d", 32, 7);
    createDecal(b.x, b.y, b.r * 1.1, "ruin", 120, null);
    if (b.owner === "enemy" && b.type === "house") {
      state.events.push("enemyOutpostDown");
    }
    state.selected = state.selected.filter((id) => id !== b.id);
    state.needsUi = true;
    state.needsMini = true;
  }

  function explodeAt(x, y, radius, damage, owner, type, source) {
    createDecal(x, y, radius, type === "fire" || type === "explosion" ? "fire" : "blast", type === "fire" ? 4 : 0.35, owner);
    const targets = [
      ...state.units.filter((u) => u.owner !== owner && !u.dead),
      ...state.buildings.filter((b) => b.owner !== owner && !b.dead && b.built)
    ];
    for (const t of targets) {
      const d = distXY(x, y, t.x, t.y);
      if (d <= radius + t.r) {
        dealDamage(source, t, damage * (1 - d / (radius + t.r) * 0.45), type);
      }
    }
    addParticle(x, y, colorForDamage(type), 24, 6);
  }

  function lineBlast(source, target, damage, type) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / len;
    const ny = dy / len;
    for (const t of enemyObjects()) {
      const px = t.x - source.x;
      const py = t.y - source.y;
      const proj = px * nx + py * ny;
      if (proj < 0 || proj > 620) continue;
      const side = Math.abs(px * ny - py * nx);
      if (side < 46 + t.r) dealDamage(source, t, damage * (1 - proj / 900), type);
    }
    for (let i = 0; i < 18; i++) addParticle(source.x + nx * i * 32, source.y + ny * i * 32, colorForDamage(type), 2, 5);
  }

  function createDecal(x, y, r, kind, ttl, owner) {
    state.decals.push({ x, y, r, kind, ttl, max: ttl, owner });
  }

  function colorForDamage(type) {
    return {
      physical: "#f5e9d2",
      arrow: "#f5e9d2",
      pierce: "#dfe9f0",
      metal: "#e8edf0",
      fire: "#f17938",
      poison: "#88c84f",
      slow: "#8bd1ff",
      water: "#64bde4",
      earth: "#c7a45c",
      wood: "#6eca79",
      siege: "#e4b35f",
      explosion: "#ffb84c",
      electric: "#78c2ff",
      seal: "#d9a348"
    }[type] || "#f5e9d2";
  }

  function enemyIdleBehavior(u, dt) {
    const base = getMainBase();
    if (!base) return;
    const d = distXY(u.x, u.y, base.x, base.y);
    if (d < 1300 || state.time > 90) {
      u.moveTarget = { x: base.x + rand(-120, 120), y: base.y + rand(-120, 120) };
      u.order = "attackMove";
    }
  }

  function updateEnemyAI(dt) {
    updateEnemyState(dt);
  }

  function spawnEnemyWave() {
    const base = getMainBase();
    if (!base) return;
    const preset = currentLevelPreset();
    const points = [
      { x: 3050, y: 520 },
      { x: 3180, y: 1780 },
      { x: 2050, y: 1980 }
    ];
    const p = choice(points);
    const early = ["lightCavalry", "spearman", "archer", "warDog"].filter((id) => isUnitUnlockedForOwner(id, "enemy", state.enemyTechs, state.enemyFaction));
    const late = ["heavyCavalry", "crossbowElite", "catapult", "shieldman", "antiAir", "spearman", "archer"].filter((id) => isUnitUnlockedForOwner(id, "enemy", state.enemyTechs, state.enemyFaction));
    const wave = state.time > 180 ? (late.length ? late : early) : early;
    const count = Math.max(1, Math.round((preset.enemyWaveCount + Math.floor(state.time / 180) * preset.enemyWaveGrowth) * preset.enemyCount));
    for (let i = 0; i < count; i++) {
      const u = createUnit(choice(wave), "enemy", p.x + rand(-60, 60), p.y + rand(-60, 60));
      u.moveTarget = { x: base.x + rand(-160, 160), y: base.y + rand(-160, 160) };
      u.order = "attackMove";
    }
    toast("敌军正在集结进攻", "warn");
  }

  function updateWeather(dt) {
    if (state.faction !== "ziran" || !hasTech("weatherCycle")) return;
    state.weatherTimer -= dt;
    if (state.weatherTimer <= 0) {
      const types = ["暴雨天象", "烈日天象", "地脉震动", "金风肃杀", "万木复苏"];
      state.weather = choice(types);
      state.weatherTimer = 32;
      toast(state.weather);
      const base = getMainBase();
      bubble(base, state.weather, "ultimate");
    }
  }

  function updateMissions() {
    for (const m of state.missions) {
      if (m.completed) continue;
      m.done = Math.min(m.need, m.check());
      if (m.done >= m.need) {
        m.completed = true;
        addResources(m.reward);
        toast(`任务完成：${m.title}`);
      }
    }
  }

  function getMainBase() {
    return playerBuildings().find((b) => b.type === "townCenter" || b.type === "fusionCore") || playerBuildings()[0];
  }

  function selectObjects(objects, append = false) {
    if (!append) state.selected = [];
    const ids = objects.filter((o) => o && o.owner === "player").map((o) => o.id);
    state.selected = [...new Set([...state.selected, ...ids])];
    for (const o of objects.filter((o) => o && o.owner === "player").slice(0, 12)) {
      createDecal(o.x, o.y, o.r + 12, "marker", 0.28, "player");
      markFx(o, "order", 0.28);
    }
    state.panelTab = inferPanelTab();
    state.needsUi = true;
  }

  function inferPanelTab() {
    const sel = selectedObjects();
    if (!sel.length) return "command";
    const first = sel[0];
    if (first.kind === "building") {
      const def = BUILDINGS[first.type];
      if (def.canTrain?.length) return "train";
      if (def.canResearch?.length) return "tech";
      return "command";
    }
    if (sel.some(isBuilderUnit)) return "build";
    return "command";
  }

  function hitTest(worldX, worldY, owner = null) {
    const all = [...state.units, ...state.buildings].filter((o) => !o.dead && (!owner || o.owner === owner));
    all.sort((a, b) => (a.kind === "unit" ? 0 : 1) - (b.kind === "unit" ? 0 : 1));
    for (const o of all) {
      if (distXY(worldX, worldY, o.x, o.y) <= o.r + (o.kind === "building" ? 18 : 6)) return o;
    }
    return null;
  }

  function issueMove(x, y, attackMove = false) {
    const units = selectedObjects().filter((o) => o.kind === "unit");
    if (!units.length) return;
    units.forEach((u, i) => {
      const row = Math.floor(i / 5);
      const col = i % 5;
      u.moveTarget = { x: x + (col - 2) * 34, y: y + row * 34 };
      u.targetId = null;
      u.order = attackMove ? "attackMove" : "move";
      markFx(u, "order", 0.55);
    });
    addCommandFeedback(x, y, attackMove ? "attack" : "move");
  }

  function issueAttack(target) {
    const units = selectedObjects().filter((o) => o.kind === "unit");
    units.forEach((u) => {
      u.targetId = target.id;
      u.order = "attack";
      markFx(u, "order", 0.55);
    });
    markFx(target, "hitFlash", 0.16);
    addCommandFeedback(target.x, target.y, "attack");
  }

  function tryPlaceBuilding(type, x, y) {
    const def = BUILDINGS[type];
    if (!def) return;
    if (!hasCost(def.cost)) {
      toast("资源不足，无法建造", "bad");
      return;
    }
    if (!canPlace(type, x, y).ok) {
      toast(canPlace(type, x, y).reason, "bad");
      return;
    }
    const workers = selectedBuilders();
    if (!workers.length) {
      toast("需要选中工兵才能建造", "bad");
      state.buildMode = null;
      state.commandMode = "select";
      state.needsUi = true;
      return;
    }
    if (!pay(def.cost)) return;
    const b = createBuilding(type, "player", x, y, { built: false });
    workers.forEach((w) => {
      w.moveTarget = { x: b.x + rand(-60, 60), y: b.y + rand(-60, 60) };
      w.targetId = null;
      w.order = "build";
      markFx(w, "order", 0.6);
    });
    createDecal(b.x, b.y, b.r + 24, "build", 1.1, "player");
    addParticle(b.x, b.y, "#ffd578", 18, 4);
    bubble(b, "施工开始", "normal");
    state.buildMode = null;
    state.commandMode = "select";
    toast(`${def.name} 开始建造`);
    state.needsUi = true;
  }

  function canPlace(type, x, y) {
    const def = BUILDINGS[type];
    if (!isBuildingAvailable(type)) return { ok: false, reason: "建筑未解锁" };
    const terrain = getTerrainAt(x, y);
    if (def.terrain === "waterEdge") {
      const nearWater = sampleAround(x, y, 120).some((p) => getTerrainAt(p.x, p.y) === "water");
      if (!nearWater) return { ok: false, reason: "该建筑需要靠近水域" };
    } else if (terrain === "water") {
      return { ok: false, reason: "不能建在深水上" };
    }
    const main = getMainBase();
    const range = state.faction === "ronghe" ? 720 : 620;
    if (main && distXY(x, y, main.x, main.y) > range && !playerBuildings().some((b) => b.built && distXY(x, y, b.x, b.y) < 420)) {
      return { ok: false, reason: "不在建造范围内" };
    }
    const r = (def.footprint || 2) * 20;
    if (state.buildings.some((b) => !b.dead && distXY(x, y, b.x, b.y) < r + b.r + 16)) return { ok: false, reason: "与其他建筑过近" };
    return { ok: true, reason: "" };
  }

  function sampleAround(x, y, r) {
    return Array.from({ length: 12 }, (_, i) => ({ x: x + Math.cos(i / 12 * TAU) * r, y: y + Math.sin(i / 12 * TAU) * r }));
  }

  function trainUnit(building, unitId) {
    const b = objectById(building.id);
    if (!b || b.dead) return;
    const def = UNITS[unitId];
    const owner = b.owner;
    const faction = owner === "enemy" ? state.enemyFaction : state.faction;
    const techs = owner === "enemy" ? state.enemyTechs : state.researched;
    if (!isUnitUnlockedForOwner(unitId, owner, techs, faction)) {
      if (owner === "player") toast("单位尚未解锁", "bad");
      return;
    }
    if (b.queue.length >= queueLimit(b)) {
      if (owner === "player") toast("生产队列已满", "bad");
      return;
    }
    const resourceBag = resourceBagForOwner(owner);
    if (resourceBag.supply + def.supply > resourceBag.supplyCap) {
      if (owner === "player") toast("人口不足，请建造民房或核心供给", "bad");
      return;
    }
    if (owner === "player" && state.faction === "ronghe" && (resourceBag.fusionSupply + (def.fusionSupply || 0) > resourceBag.fusionCap)) {
      toast("融合人口不足", "bad");
      return;
    }
    if (!payForOwner(owner, def.cost)) {
      if (owner === "player") toast("资源不足，无法训练", "bad");
      return;
    }
    const levelPreset = currentLevelPreset();
    const speed = owner === "enemy" ? (levelPreset.enemyBuildSpeed || 1) * (state.enemyModifiers.trainSpeed || 1) : 1;
    b.queue.push({ unit: unitId, remaining: def.trainTime / speed, total: def.trainTime / speed });
    markFx(b, "buildPulse", 0.55);
    createDecal(b.x, b.y, b.r + 18, "spawn", 0.55, owner);
    addParticle(b.x, b.y, owner === "enemy" ? "#d45a48" : "#68a9ff", 10, 3);
    bubble(b, "开始训练", "normal");
    state.needsUi = true;
  }

  function queueLimit(b) {
    return 3 + (b.level >= 2 ? 1 : 0) + (b.level >= 3 ? 1 : 0);
  }

  function researchTech(building, techId) {
    const b = objectById(building.id);
    const tech = TECHS[techId];
    if (!b || !tech) return;
    const owner = b.owner;
    if (ownerHasTech(owner, techId)) {
      toast("该科技已研究", "bad");
      return;
    }
    if (owner === "player" ? !isTechAvailable(techId, b) : !isTechAvailableForOwner(techId, owner, state.enemyTownLevel, b.level || 1, state.enemyTechs)) {
      toast("科技条件未满足", "bad");
      return;
    }
    if (b.researchQueue.length >= (b.level >= 3 ? 2 : 1)) {
      toast("研究队列已满", "bad");
      return;
    }
    if (!payForOwner(owner, tech.cost)) {
      toast("资源不足，无法研究", "bad");
      return;
    }
    const levelPreset = currentLevelPreset();
    const speed = owner === "enemy" ? (levelPreset.enemyBuildSpeed || 1) * (state.enemyModifiers.trainSpeed || 1) : 1;
    b.researchQueue.push({ tech: techId, remaining: tech.time / speed, total: tech.time / speed });
    markFx(b, "upgrade", 0.45);
    createDecal(b.x, b.y, b.r + 20, "upgrade", 0.7, owner);
    addParticle(b.x, b.y, "#ffd578", 12, 3);
    bubble(b, "开始研究", "normal");
    state.needsUi = true;
  }

  function upgradeTown() {
    const base = getMainBase();
    if (!base || state.townLevel >= 3) return;
    const cost = state.townLevel === 1 ? { gold: 800, wood: 500, stone: 450, metal: 150 } : { gold: 1600, wood: 900, stone: 1000, metal: 600 };
    if (!pay(cost)) {
      toast("资源不足，无法升级主城", "bad");
      return;
    }
    state.townLevel += 1;
    base.level = state.townLevel;
    base.maxHp += state.townLevel === 2 ? 2000 : 2500;
    base.hp = base.maxHp;
    addEntityBurst(base, "upgrade");
    createDecal(base.x, base.y, base.r + 64, "upgrade", 1.6, "player");
    for (let i = 0; i < 5; i++) addBeam(base.x, base.y - base.r, base.x + Math.cos(i / 5 * TAU) * (base.r + 80), base.y + Math.sin(i / 5 * TAU) * (base.r + 80), "#ffd578", 0.32, 3);
    bubble(base, `主城 ${state.townLevel}级`, "ultimate");
    toast(`主城升级至 ${state.townLevel} 级`);
    state.needsUi = true;
  }

  function useAbility(name, source) {
    const sel = selectedObjects();
    const primary = source || sel[0] || getMainBase();
    if (!primary) return;
    if (name === "townUpgrade") return upgradeTown();
    if (name === "warOrder") {
      if (!hasTech("warOrder")) return toast("尚未研究整军令", "bad");
      applyGlobalBuff("warOrder", 30);
      bubble(primary, "整军令", "ultimate");
      toast("整军令发动：生产速度提升");
    }
    if (name === "fortifyOrder") {
      if (!hasTech("fortifyOrder")) return toast("尚未研究守城令", "bad");
      applyGlobalBuff("fortifyOrder", 25);
      bubble(primary, "守城令", "ultimate");
      toast("守城令发动：建筑护甲提升");
    }
    if (name === "heavenOrder") {
      if (!hasTech("heavenOrder")) return toast("尚未研究天威令", "bad");
      applyGlobalBuff("heavenOrder", 20);
      bubble(primary, "天威令", "ultimate");
      toast("天威令发动：全军强化");
    }
    if (name === "overload") {
      if (!hasTech("energyOverload")) return toast("需要能源过载协议", "bad");
      for (const o of sel) {
        if (o.kind === "unit" && UNITS[o.type].tags?.includes("mechanical")) {
          applyStatus(o, "overload", 8, o.id, 1);
          bubble(o, "过载启动", "attack");
        }
        if (o.kind === "building" && BUILDINGS[o.type].faction === "jixie") {
          o.overloaded = 12;
          bubble(o, "全功率过载", "attack");
        }
      }
    }
    if (name === "beastTide") {
      if (!hasTech("beastTide")) return toast("尚未解锁万兽狂潮", "bad");
      for (const u of playerUnits().filter((u) => UNITS[u.type].tags?.includes("beast"))) applyStatus(u, "overload", 30, primary.id, 1);
      bubble(primary, "万兽狂潮", "ultimate");
      toast("万兽狂潮发动");
    }
    if (name === "fusion") {
      return performFusion(primary);
    }
    if (name === "weather") {
      if (!hasTech("weatherCycle")) return toast("尚未研究五行轮转", "bad");
      state.weatherTimer = 0.1;
    }
    state.needsUi = true;
  }

  function applyGlobalBuff(kind, ttl) {
    for (const u of playerUnits()) applyStatus(u, kind, ttl, 0, 1);
    for (const b of playerBuildings()) applyStatus(b, kind, ttl, 0, 1);
  }

  function performFusion(altar) {
    const candidates = selectedObjects().filter((o) => o.kind === "unit" && o.owner === "player" && UNITS[o.type].element && o.hp > o.maxHp * 0.5);
    if (candidates.length < 2) {
      toast("请选择两个生命高于 50% 的元素单位", "bad");
      return;
    }
    const a = candidates[0];
    const b = candidates.find((x) => x.id !== a.id);
    const ea = UNITS[a.type].element;
    const eb = UNITS[b.type].element;
    const recipe = FUSION_RECIPES.find((r) => (r.a === ea && r.b === eb) || (r.a === eb && r.b === ea));
    if (!recipe) {
      toast("当前元素组合没有融合配方", "bad");
      return;
    }
    const result = UNITS[recipe.result];
    if (result.unlockTech && !hasTech(result.unlockTech)) {
      toast("融合单位尚未解锁", "bad");
      return;
    }
    if (!hasCost(result.cost)) {
      toast("融合资源不足", "bad");
      return;
    }
    pay(result.cost);
    killUnit(a, true);
    killUnit(b, true);
    setTimeout(() => {
      const u = createUnit(recipe.result, "player", altar.x + rand(-50, 50), altar.y + altar.r + 58, { fusion: true, spawnFx: 0.9 });
      bubble(u, "融合诞生", "ultimate");
      addEntityBurst(u, "spawn");
      addParticle(u.x, u.y, "#8ce7c6", 40, 6);
      toast(`${result.name} 融合完成`);
    }, 400);
    bubble(altar, recipe.name, "ultimate");
    state.events.push("fusionDone");
  }

  function setArrowMode(mode) {
    if (!state.unlockedArrowModes.has(mode)) {
      toast("箭矢模式尚未研究", "bad");
      return;
    }
    state.activeArrow = mode;
    for (const u of selectedObjects().filter((o) => o.kind === "unit" && UNITS[o.type].tags?.includes("archer"))) {
      u.mode.arrow = mode;
      bubble(u, arrowLabel(mode), "normal");
    }
    state.needsUi = true;
  }

  function arrowLabel(mode) {
    return { normal: "普通箭", fire: "火箭矢", poison: "毒箭矢", slow: "缓速箭", pierce: "穿甲箭" }[mode] || mode;
  }

  function setFormation(mode) {
    const needed = { defense: "defenseFormation", arrow: "arrowFormation", snake: "snakeFormation", royal: "royalFormation" }[mode];
    if (mode !== "none" && needed && !hasTech(needed)) {
      toast("阵法尚未研究", "bad");
      return;
    }
    state.activeFormation = mode;
    for (const u of selectedObjects().filter((o) => o.kind === "unit")) {
      u.mode.formation = mode;
      bubble(u, formationLabel(mode), "normal");
    }
    state.needsUi = true;
  }

  function formationLabel(mode) {
    return { none: "散阵", defense: "固守阵", arrow: "锋矢阵", snake: "长蛇阵", royal: "羽林阵" }[mode] || mode;
  }

  function renderUI() {
    if (!state.started || state.battleState === "menu") {
      renderMenuPages();
      state.needsUi = false;
      return;
    }
    renderTopBar();
    renderMissionPanel();
    renderSideCommands();
    renderBottomHud();
    renderGroupBar();
    renderSettingsPanel();
    state.needsUi = false;
  }

  function renderTopBar() {
    const f = FACTIONS[state.faction];
    const visible = ["gold", "wood", "stone", "metal"];
    if (state.faction === "jixie") visible.push("power");
    if (state.faction === "ziran") visible.push("jade");
    if (state.faction === "yaoshou") visible.push("blood");
    visible.push("supply");
    ui.topBar.innerHTML = `
      <div class="brand-block">
        <div class="lord-portrait"></div>
        <div>
          <div class="brand-title">战斗 <span class="seal">${f.name}</span></div>
          <div class="brand-meta">
            <span>${f.lord}等级 ${state.level}</span>
            <span class="xp-bar"><span class="xp-fill" style="width:${clamp(state.exp / 8000 * 100, 4, 100)}%"></span></span>
            <span>势力 ${formatNum(state.power)}</span>
          </div>
        </div>
      </div>
      <div class="resource-strip">
        ${visible.map((k) => renderResourceChip(k)).join("")}
      </div>
    `;
  }

  function renderResourceChip(key) {
    const info = RES[key];
    const value = key === "supply" ? `${Math.floor(state.resources.supply)}/${Math.floor(state.resources.supplyCap)}` : Math.floor(state.resources[key] || 0);
    const income = key !== "supply" && state.income[key] ? `<span class="res-income">+${formatNum(state.income[key])}/时</span>` : "";
    const dataKey = key === "supply" ? "supply" : key;
    return `
      <div class="res-chip" data-res="${dataKey}">
        <span class="res-icon">${info.icon}</span>
        <span class="res-value">${typeof value === "number" ? formatNum(value) : value}</span>
        ${income}
      </div>
    `;
  }

  function renderMissionPanel() {
    ui.missionPanel.innerHTML = `
      <div class="mission-title">
        <span>任务目标</span>
        <span>${FACTIONS[state.faction].name}</span>
      </div>
      ${state.missions.map((m) => `
        <div class="objective">
          <div class="objective-row">
            <strong>${m.title}</strong>
            <span>${Math.floor(m.done)}/${m.need}</span>
          </div>
          <div class="mini-progress"><span style="width:${clamp(m.done / m.need * 100, 0, 100)}%"></span></div>
        </div>
      `).join("")}
      <div class="log-list">
        ${recentLogLines().map((line) => `
          <div class="log-entry">
            <span class="log-tag">${line[0]}</span>
            <span>${line[1]}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function recentLogLines() {
    const lines = [
      ["系统", `${FACTIONS[state.faction].special}`],
      ["世界", `战场时间 ${formatTime(state.time)}`],
      ["坐标", `X:${Math.round(state.mouse.worldX)} Y:${Math.round(state.mouse.worldY)}`]
    ];
    if (state.weather) lines.unshift(["天象", state.weather]);
    if (state.faction === "jixie") lines.unshift(["电网", state.resources.power >= 0 ? "供电充足" : "电力不足"]);
    return lines.slice(0, 5);
  }

  function renderSideCommands() {
    const commands = contextCommandsForSelection(selectedObjects());
    if (!commands.length) {
      ui.sideCommands.innerHTML = "";
      return;
    }
    ui.sideCommands.innerHTML = `
      <div class="context-title">命令</div>
      ${commands.map((c) => `
        <button class="context-command-btn" data-context-command="${c.id}" ${c.enabled ? "" : "disabled"} data-source="${c.source || ""}">
          <span class="context-command-icon">${c.icon}</span>
          <span class="context-command-text">${c.label}</span>
        </button>
      `).join("")}
    `;
  }

  function contextCommandsForSelection(sel) {
    const commands = [];
    const workers = sel.filter(isWorkerUnit);
    const builders = sel.filter(isBuilderUnit);
    const building = sel.length === 1 && sel[0].kind === "building" ? sel[0] : null;
    if (workers.length) {
      commands.push({ id: "gather", label: "采集", icon: "采", enabled: true });
    }
    if (state.buildMode && builders.length) {
      commands.push({ id: "cancelBuild", label: "取消建造", icon: "止", enabled: true });
    }
    if (building && BUILDINGS[building.type]?.canTrain?.length) {
      commands.push({ id: "setRally", label: "集结点", icon: "旗", enabled: true, source: building.id });
    }
    if (building && ["townCenter", "fusionCore"].includes(building.type)) {
      commands.push({ id: "townUpgrade", label: "升级主城", icon: "升", enabled: state.townLevel < 3 });
    }
    return commands;
  }

  function renderSettingsPanel() {
    ui.settingsBtn.classList.toggle("active", state.settingsOpen);
    if (!state.settingsOpen) {
      ui.settingsPanel.classList.add("hidden");
      ui.settingsPanel.innerHTML = "";
      return;
    }
    ui.settingsPanel.classList.remove("hidden");
    ui.settingsPanel.innerHTML = `
      <div class="settings-head">
        <strong>设置</strong>
        <button class="small-btn" data-setting-action="close">关闭</button>
      </div>
      <div class="settings-section">
        <div class="settings-row">
          <span>战斗状态</span>
          <button class="small-btn ${state.paused ? "active" : ""}" data-setting-action="pause">${state.paused ? "继续" : "暂停"}</button>
        </div>
        <div class="settings-row vertical">
          <span>速度</span>
          <div class="seg-row">
            ${[0.5, 1, 1.5, 2].map((v) => `<button class="small-btn ${state.speed === v ? "active" : ""}" data-setting-action="speed" data-value="${v}">${v}x</button>`).join("")}
          </div>
        </div>
      </div>
      <div class="settings-section">
        <label class="toggle-row"><input type="checkbox" data-setting-action="toggleHp" ${state.showHpBars ? "checked" : ""}> <span>生命条</span></label>
        <label class="toggle-row"><input type="checkbox" data-setting-action="toggleDamage" ${state.showDamageText ? "checked" : ""}> <span>伤害数字</span></label>
        <label class="toggle-row"><input type="checkbox" data-setting-action="toggleNames" ${state.showSelectionNames ? "checked" : ""}> <span>选中名称</span></label>
      </div>
      <div class="settings-section">
        <button class="primary-btn settings-wide" data-setting-action="save">保存</button>
        <button class="primary-btn settings-wide" data-setting-action="load">加载</button>
        <button class="small-btn settings-wide" data-setting-action="restart">重新开局</button>
      </div>
    `;
  }

  function countAvailableBuildings() {
    return factionBuildings().filter(([id]) => id !== "townCenter" && id !== "fusionCore").length;
  }

  function workerIdleCount() {
    return playerUnits().filter((u) => isWorkerUnit(u) && (u.order === "idle" || u.order === "gather")).length;
  }

  function activeTechCount() {
    return playerBuildings().flatMap((b) => b.researchQueue).length;
  }

  function renderBottomHud() {
    const sel = selectedObjects();
    ui.bottomHud.innerHTML = `
      <div class="selection-info">${renderSelectionInfo(sel)}</div>
      <div class="action-panel">${renderActionPanel(sel)}</div>
    `;
    bindCardEvents(ui.bottomHud);
  }

  function renderSelectionInfo(sel) {
    if (!sel.length) {
      return `
        <div class="entity-header">
          <div class="entity-icon-wrap">${assetImg("building", state.faction === "ronghe" ? "fusionCore" : "townCenter", 76, 72)}</div>
          <div class="entity-title">
            <div class="entity-name">${FACTIONS[state.faction].name}军府</div>
            <div class="entity-sub">${FACTIONS[state.faction].special}</div>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat-card"><div class="k">主城等级</div><div class="v">${state.townLevel}</div></div>
          <div class="stat-card"><div class="k">战斗单位</div><div class="v">${playerUnits().filter((u) => !UNITS[u.type].tags?.includes("worker")).length}</div></div>
          <div class="stat-card"><div class="k">建筑</div><div class="v">${playerBuildings().length}</div></div>
          <div class="stat-card"><div class="k">科技</div><div class="v">${state.researched.size}</div></div>
        </div>
      `;
    }
    if (sel.length > 1) {
      const byType = new Map();
      for (const o of sel) byType.set(o.type, (byType.get(o.type) || 0) + 1);
      const leader = sel[0];
      return `
        <div class="entity-header">
          <div class="entity-icon-wrap">${assetImg(leader.kind, leader.type, 76, 72)}</div>
          <div class="entity-title">
            <div class="entity-name">已选 ${sel.length} 个单位</div>
            <div class="entity-sub">${[...byType.entries()].map(([k, v]) => `${entityName(k, leader.kind)} x${v}`).join("，")}</div>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat-card"><div class="k">平均生命</div><div class="v">${Math.round(sel.reduce((a, o) => a + o.hp / o.maxHp, 0) / sel.length * 100)}%</div></div>
          <div class="stat-card"><div class="k">编队</div><div class="v">${state.groups.filter((g) => g.length).length}/10</div></div>
          <div class="stat-card"><div class="k">阵法</div><div class="v">${formationLabel(state.activeFormation)}</div></div>
          <div class="stat-card"><div class="k">命令</div><div class="v">${state.commandMode === "attack" ? "出征" : "待命"}</div></div>
        </div>
        <div class="mode-row">${sel.slice(0, 18).map((o) => `<span class="state-pill">${entityName(o.type, o.kind)}</span>`).join("")}</div>
      `;
    }
    const o = sel[0];
    const def = o.kind === "unit" ? UNITS[o.type] : BUILDINGS[o.type];
    const hpPct = o.maxHp ? o.hp / o.maxHp * 100 : 100;
    const sub = o.kind === "unit"
      ? `${def.role} · ${def.tags?.join(" / ") || ""}`
      : `${def.category} · ${o.built ? `${o.level || 1}级` : "建造中"}`;
    return `
      <div class="entity-header">
        <div class="entity-icon-wrap">${assetImg(o.kind, o.type, 76, 72)}</div>
        <div class="entity-title">
          <div class="entity-name">${def.name}</div>
          <div class="entity-sub">${sub}</div>
        </div>
      </div>
      <div class="bar-row">
        <div class="bar-label"><span>生命</span><span>${Math.ceil(o.hp)}/${Math.ceil(o.maxHp || def.hp)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${clamp(hpPct, 0, 100)}%"></div></div>
      </div>
      ${o.kind === "building" && !o.built ? `
        <div class="bar-row">
          <div class="bar-label"><span>建造</span><span>${formatTime(o.buildRemaining)}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${clamp((1 - o.buildRemaining / o.buildTotal) * 100, 0, 100)}%"></div></div>
        </div>
      ` : ""}
      <div class="stat-grid">
        ${renderStats(o).map(([k, v]) => `<div class="stat-card"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("")}
      </div>
      <div class="mode-row">
        ${(o.status || []).map((s) => `<span class="state-pill ok">${statusName(s.kind)} ${formatTime(s.ttl)}</span>`).join("")}
      </div>
    `;
  }

  function renderStats(o) {
    if (o.kind === "building") {
      const def = BUILDINGS[o.type];
      const rows = [
        ["护甲", o.armor],
        ["占地", `${def.footprint || 2}x${def.footprint || 2}`],
        ["队列", `${o.queue.length}/${queueLimit(o)}`],
        ["研究", o.researchQueue.length ? TECHS[o.researchQueue[0].tech].name : "空闲"]
      ];
      if (state.faction === "jixie") rows[3] = ["供电", o.powered ? "正常" : "缺电"];
      return rows;
    }
    const def = UNITS[o.type];
    return [
      ["星级", `${o.star}星`],
      ["攻击", `${Math.round(def.damage[0])}-${Math.round(def.damage[1])}`],
      ["护甲", o.armor],
      ["射程", Math.round(getUnitRange(o))],
      ["移速", Math.round(getUnitSpeed(o))],
      ["经验", o.exp]
    ];
  }

  function statusName(kind) {
    return {
      burn: "燃烧",
      poison: "中毒",
      slow: "减速",
      armorBreak: "破甲",
      overLoad: "过载",
      overload: "过载",
      inspired: "鼓舞",
      supplied: "补给",
      spearWall: "枪阵",
      shieldAdvance: "举盾",
      warOrder: "整军",
      fortifyOrder: "守城",
      heavenOrder: "天威"
    }[kind] || kind;
  }

  function entityName(type, kind) {
    return kind === "building" ? BUILDINGS[type]?.name : UNITS[type]?.name;
  }

  function renderActionPanel(sel) {
    const tabs = availableTabs(sel);
    if (!tabs.some((t) => t.id === state.panelTab)) state.panelTab = tabs[0]?.id || "";
    return `
      ${tabs.length ? `<div class="tab-row">${tabs.map((t) => `<button class="tab-btn ${state.panelTab === t.id ? "active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("")}</div>` : ""}
      <div>${renderPanelContent(sel)}</div>
      <div class="queue-area">${renderQueueArea(sel)}</div>
    `;
  }

  function availableTabs(sel) {
    const tabs = [];
    if (sel.some(isBuilderUnit)) tabs.push({ id: "build", label: "建造" });
    if (sel.length === 1 && sel[0].kind === "building" && BUILDINGS[sel[0].type].canTrain?.length) tabs.push({ id: "train", label: "造兵" });
    if (sel.length === 1 && sel[0].kind === "building" && BUILDINGS[sel[0].type].canResearch?.length) tabs.push({ id: "tech", label: "科技" });
    if (sel.some((o) => (o.kind === "unit" && hasSpecialAbilities(o)) || (o.kind === "building" && hasSpecialBuildingAbilities(o)))) tabs.push({ id: "skills", label: "技能" });
    return tabs;
  }

  function hasSpecialAbilities(o) {
    return (UNITS[o.type].abilities || []).some((a) => !["build", "repair"].includes(a));
  }

  function hasSpecialBuildingAbilities(o) {
    return (BUILDINGS[o.type].abilities || []).length || o.type === "townCenter" || o.type === "fusionCore";
  }

  function renderPanelContent(sel) {
    if (state.panelTab === "build" && selectedBuilders().length) return renderBuildPanel();
    if (state.panelTab === "train") return renderTrainPanel(sel[0]);
    if (state.panelTab === "tech") return renderTechPanel(sel[0]);
    if (state.panelTab === "skills") return renderSkillPanel(sel);
    return `<div class="empty-state">当前无可用面板</div>`;
  }

  function renderBuildPanel() {
    if (!selectedBuilders().length) return `<div class="empty-state">当前无可用建造单位</div>`;
    const cats = ["全部", "资源", "军队", "科技", "防御", "核心"];
    const cards = factionBuildings()
      .filter(([id]) => !["townCenter", "fusionCore"].includes(id))
      .filter(([, b]) => state.buildCategory === "全部" || b.category === state.buildCategory);
    return `
      <div class="category-row">${cats.map((c) => `<button class="category-btn ${state.buildCategory === c ? "active" : ""}" data-build-category="${c}">${c}</button>`).join("")}</div>
      <div class="card-strip">
        ${cards.map(([id, b]) => renderGameCard("building", id, {
          action: "build",
          enabled: hasCost(b.cost) && isBuildingAvailable(id),
          status: canBuildStatus(id),
          meta: b.desc
        })).join("") || `<div class="empty-state">没有可建造建筑</div>`}
      </div>
    `;
  }

  function canBuildStatus(id) {
    const b = BUILDINGS[id];
    if (!isBuildingAvailable(id)) return "未解锁";
    if (!hasCost(b.cost)) return "资源不足";
    return "可建造";
  }

  function renderTrainPanel(building) {
    if (!building) return `<div class="empty-state">请选择生产建筑</div>`;
    const ids = factionUnitsForBuilding(building);
    return `
      <div class="split-row">
        <div class="category-row">
          ${["全部", "步兵", "骑兵", "飞行", "水军", "攻城", "后勤", "机械", "妖兽", "元素", "融合"].map((c) => `<button class="category-btn ${state.cardCategory === c ? "active" : ""}" data-card-category="${c}">${c}</button>`).join("")}
        </div>
        <button class="small-btn" data-action="set-rally" data-id="${building.id}">集结点</button>
      </div>
      <div class="card-strip">
        ${ids.filter((id) => unitCategoryMatch(id, state.cardCategory)).map((id) => renderGameCard("unit", id, {
          action: "train",
          source: building.id,
          enabled: canTrainStatus(building, id) === "可训练",
          status: canTrainStatus(building, id),
          meta: UNITS[id].desc
        })).join("") || `<div class="empty-state">当前分类没有单位</div>`}
      </div>
    `;
  }

  function unitCategoryMatch(id, cat) {
    if (cat === "全部") return true;
    const tags = UNITS[id].tags || [];
    const map = {
      步兵: "infantry",
      骑兵: "cavalry",
      飞行: "flying",
      水军: "ship",
      攻城: "siege",
      后勤: "support",
      机械: "mechanical",
      妖兽: "beast",
      元素: "element",
      融合: "hybrid"
    };
    return tags.includes(map[cat]);
  }

  function canTrainStatus(building, id) {
    const def = UNITS[id];
    if (!isUnitUnlocked(id)) return "未解锁";
    if (building.queue.length >= queueLimit(building)) return "队列满";
    if (state.resources.supply + def.supply > state.resources.supplyCap) return "人口不足";
    if (state.faction === "ronghe" && state.resources.fusionSupply + (def.fusionSupply || 0) > state.resources.fusionCap) return "融合人口不足";
    if (!hasCost(def.cost)) return "资源不足";
    return "可训练";
  }

  function renderTechPanel(building) {
    if (!building) return `<div class="empty-state">请选择科技建筑</div>`;
    const ids = BUILDINGS[building.type].canResearch || [];
    const cats = ["全部", ...new Set(ids.map((id) => TECHS[id]?.category).filter(Boolean))];
    return `
      <div class="category-row">${cats.map((c) => `<button class="category-btn ${state.cardCategory === c ? "active" : ""}" data-card-category="${c}">${c}</button>`).join("")}</div>
      <div class="card-strip">
        ${ids.filter((id) => state.cardCategory === "全部" || TECHS[id]?.category === state.cardCategory).map((id) => renderGameCard("tech", id, {
          action: "research",
          source: building.id,
          enabled: canResearchStatus(building, id) === "可研究",
          status: canResearchStatus(building, id),
          meta: TECHS[id].desc
        })).join("") || `<div class="empty-state">当前分类没有科技</div>`}
      </div>
    `;
  }

  function canResearchStatus(building, id) {
    if (hasTech(id)) return "已研究";
    if (!isTechAvailable(id, building)) return "未解锁";
    if (building.researchQueue.length >= (building.level >= 3 ? 2 : 1)) return "队列满";
    if (!hasCost(TECHS[id].cost)) return "资源不足";
    return "可研究";
  }

  function renderSkillPanel(sel) {
    const actions = [];
    const first = sel[0];
    if (first?.kind === "building" && ["townCenter", "fusionCore"].includes(first.type)) {
      actions.push({ id: "townUpgrade", label: "升级主城", desc: "提升阶段，解锁更多建筑和科技。", enabled: state.townLevel < 3 });
      actions.push({ id: "warOrder", label: "整军令", desc: "生产速度提升。", enabled: hasTech("warOrder") });
      actions.push({ id: "fortifyOrder", label: "守城令", desc: "建筑护甲提升。", enabled: hasTech("fortifyOrder") });
      actions.push({ id: "heavenOrder", label: "天威令", desc: "全军攻击和护甲提升。", enabled: hasTech("heavenOrder") });
    }
    if (state.faction === "huaxia") {
      actions.push(...["normal", "fire", "poison", "slow", "pierce"].map((m) => ({ id: `arrow:${m}`, label: arrowLabel(m), desc: "弓手、防空弩兵、神臂弩手切换箭矢模式。", enabled: state.unlockedArrowModes.has(m) })));
      actions.push(...["none", "defense", "arrow", "snake", "royal"].map((m) => ({ id: `formation:${m}`, label: formationLabel(m), desc: "切换当前选中部队阵法。", enabled: m === "none" || !["defense", "arrow", "snake", "royal"].includes(m) || hasTech({ defense: "defenseFormation", arrow: "arrowFormation", snake: "snakeFormation", royal: "royalFormation" }[m]) })));
    }
    if (state.faction === "jixie") actions.push({ id: "overload", label: "过载", desc: "机械单位/建筑短时强化，之后过热。", enabled: hasTech("energyOverload") });
    if (state.faction === "yaoshou") actions.push({ id: "beastTide", label: "万兽狂潮", desc: "全体妖兽短时间强化。", enabled: hasTech("beastTide") });
    if (state.faction === "ziran") {
      actions.push({ id: "fusion", label: "元素融合", desc: "选择两个元素单位，在融合坛生成新单位。", enabled: selectedObjects().filter((o) => o.kind === "unit" && UNITS[o.type].element).length >= 2 });
      actions.push({ id: "weather", label: "五行轮转", desc: "触发一次自然天象。", enabled: hasTech("weatherCycle") });
    }
    if (state.faction === "ronghe") actions.push({ id: "route", label: state.routes.ronghe, desc: "当前定向融合路线。", enabled: false });
    return `
      <div class="card-strip">
        ${actions.map((a) => `
          <button class="game-card ${a.enabled ? "" : "locked"}" data-ability="${a.id}" ${a.enabled ? "" : "disabled"} data-tip-title="${a.label}" data-tip-body="${a.desc}">
            <div class="card-title">${a.label}</div>
            <div class="card-art">${assetImg("ability", a.id, 108, 72)}</div>
            <div class="card-meta"><span class="state-pill ${a.enabled ? "ok" : "bad"}">${a.enabled ? "可用" : "未满足"}</span></div>
          </button>
        `).join("") || `<div class="empty-state">没有可用技能</div>`}
      </div>
    `;
  }

  function renderQueueArea(sel) {
    const b = sel.length === 1 && sel[0].kind === "building" ? sel[0] : null;
    if (!b) return `<div class="queue-title"><span>队列</span><span>空闲</span></div>`;
    const trainItems = b.queue.map((q, i) => ({ name: UNITS[q.unit].name, progress: 1 - q.remaining / q.total, text: i === 0 ? formatTime(q.remaining) : "等待中" }));
    const techItems = b.researchQueue.map((q, i) => ({ name: TECHS[q.tech].name, progress: 1 - q.remaining / q.total, text: i === 0 ? formatTime(q.remaining) : "等待中" }));
    const items = [...trainItems, ...techItems];
    return `
      <div class="queue-title"><span>生产 / 研究队列</span><span>${items.length ? `${items.length} 项` : "空闲"}</span></div>
      <div class="queue-list">
        ${items.map((q) => `
          <div class="queue-item">
            <div class="queue-name">${q.name} · ${q.text}</div>
            <div class="queue-progress"><span style="width:${clamp(q.progress * 100, 0, 100)}%"></span></div>
          </div>
        `).join("") || `<div class="queue-item"><div class="queue-name">队列空闲</div><div class="queue-progress"><span></span></div></div>`}
      </div>
    `;
  }

  function renderGameCard(kind, id, opts) {
    const def = kind === "building" ? BUILDINGS[id] : kind === "tech" ? TECHS[id] : UNITS[id];
    const cost = def.cost || {};
    const title = def.name;
    const cls = opts.enabled ? "" : "locked";
    const statusTone = opts.status === "可建造" || opts.status === "可训练" || opts.status === "可研究" ? "ok" : opts.status === "已研究" ? "warn" : "bad";
    return `
      <button class="game-card ${cls}" data-card-kind="${kind}" data-card-id="${id}" data-action="${opts.action || ""}" data-source="${opts.source || ""}" ${opts.enabled ? "" : "disabled"} data-tip-title="${title}" data-tip-body="${escapeAttr(cardTooltip(kind, id, opts.meta))}">
        <div class="card-title">${title}</div>
        <div class="card-art">${assetImg(kind, id, 108, 72)}</div>
        <div class="card-meta">
          <span class="state-pill ${statusTone}">${opts.status}</span>
          <span class="cost-row">${Object.entries(cost).slice(0, 4).map(([k, v]) => `<span class="cost-pill">${RES[k]?.short || k}${v}</span>`).join("") || `<span class="cost-pill">免费</span>`}</span>
        </div>
      </button>
    `;
  }

  function cardTooltip(kind, id, meta = "") {
    const def = kind === "building" ? BUILDINGS[id] : kind === "tech" ? TECHS[id] : UNITS[id];
    if (kind === "unit") {
      return `${def.role}\n生命 ${def.hp}  攻击 ${def.damage[0]}-${def.damage[1]}  护甲 ${def.armor}  人口 ${def.supply}\n消耗：${costText(def.cost)}\n${def.desc}`;
    }
    if (kind === "building") {
      return `${def.category}\n生命 ${def.hp}  护甲 ${def.armor}  占地 ${def.footprint || 2}x${def.footprint || 2}\n消耗：${costText(def.cost)}\n${def.desc}`;
    }
    return `${def.category}\n时间 ${formatTime(def.time)}  消耗：${costText(def.cost)}\n${def.desc}`;
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function bindCardEvents(root) {
    root.querySelectorAll("[data-tip-title]").forEach((el) => {
      el.addEventListener("mouseenter", showTip);
      el.addEventListener("mousemove", moveTip);
      el.addEventListener("mouseleave", hideTip);
    });
  }

  function showTip(e) {
    const el = e.currentTarget;
    const title = el.dataset.tipTitle || "";
    const body = el.dataset.tipBody || "";
    ui.tooltip.hidden = false;
    ui.tooltip.innerHTML = `<h3>${title}</h3>${body.split("\n").map((p) => `<p>${p}</p>`).join("")}`;
    moveTip(e);
  }

  function moveTip(e) {
    const rectW = 340;
    const x = Math.min(window.innerWidth - rectW - 12, e.clientX + 18);
    const y = Math.min(window.innerHeight - 160, e.clientY + 18);
    ui.tooltip.style.left = `${Math.max(12, x)}px`;
    ui.tooltip.style.top = `${Math.max(12, y)}px`;
  }

  function hideTip() {
    ui.tooltip.hidden = true;
  }

  function renderGroupBar() {
    ui.groupBar.innerHTML = Array.from({ length: 10 }, (_, i) => {
      const group = state.groups[i].filter((id) => objectById(id));
      state.groups[i] = group;
      const active = group.length && group.every((id) => state.selected.includes(id));
      return `
        <button class="group-item ${active ? "active" : ""}" data-group="${i}">
          <span class="group-num">${i === 9 ? 0 : i + 1}</span>
          <span class="group-count">${group.length || "-"}</span>
        </button>
      `;
    }).join("");
  }

  function assetImg(kind, id, w, h) {
    const src = assetDataUrl(kind, id, w, h);
    return `<img src="${src}" alt="" width="${w}" height="${h}" draggable="false" />`;
  }

  function assetDataUrl(kind, id, w = 96, h = 72) {
    const assetFaction = kind === "faction" ? id : state.faction;
    const key = `${kind}:${id}:${w}:${h}:${assetFaction}`;
    const map = kind === "building" ? viewAssets.building : kind === "unit" ? viewAssets.unit : viewAssets.faction;
    if (map.has(key)) return map.get(key);
    const c = document.createElement("canvas");
    c.width = w * 2;
    c.height = h * 2;
    const g = c.getContext("2d");
    g.scale(2, 2);
    drawAsset(g, kind, id, 0, 0, w, h);
    const url = c.toDataURL("image/png");
    map.set(key, url);
    return url;
  }

  function warmAllEntityAssets() {
    const faction = state.faction;
    const run = () => {
      if (!state.started || state.faction !== faction) return;
      for (const id of Object.keys(BUILDINGS)) assetDataUrl("building", id, 108, 72);
      for (const id of Object.keys(UNITS)) assetDataUrl("unit", id, 108, 72);
    };
    if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 180);
  }

  function drawAsset(g, kind, id, x, y, w, h) {
    g.save();
    g.translate(x, y);
    const faction = kind === "unit" ? (UNITS[id]?.faction === "all" ? state.faction : UNITS[id]?.faction) : kind === "building" ? (BUILDINGS[id]?.faction === "all" ? state.faction : BUILDINGS[id]?.faction) : id;
    const color = FACTIONS[faction]?.color || "#777";
    const accent = FACTIONS[faction]?.accent || "#d9a348";
    drawAssetBackdrop(g, w, h, color, accent, kind);
    if (kind === "building") drawBuildingAssetHQ(g, id, w, h, color, accent);
    else if (kind === "unit") drawUnitAssetHQ(g, id, w, h, color, accent);
    else drawAbilityAsset(g, id, w, h, color, accent);
    g.restore();
  }

  function drawBuildingAsset(g, id, w, h, color, accent) {
    const def = BUILDINGS[id];
    g.translate(w / 2, h / 2 + 5);
    g.fillStyle = "rgba(0,0,0,.18)";
    ellipse(g, 0, 18, w * 0.36, 8);
    g.fill();
    const size = Math.min(w, h) * 0.44;
    g.fillStyle = "#715238";
    g.fillRect(-size * 0.75, -size * 0.15, size * 1.5, size * 0.85);
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(-size * 0.9, -size * 0.15);
    g.lineTo(0, -size * 0.85);
    g.lineTo(size * 0.9, -size * 0.15);
    g.closePath();
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 2;
    g.stroke();
    if (def?.category === "防御") {
      g.fillStyle = "#5c493a";
      g.fillRect(-size * 0.25, -size * 0.62, size * 0.5, size * 1.1);
      g.fillStyle = accent;
      g.fillRect(-size * 0.4, -size * 0.76, size * 0.8, size * 0.18);
    } else if (def?.category === "资源") {
      g.fillStyle = accent;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.arc(-size * 0.45 + i * size * 0.22, size * 0.1 + Math.sin(i) * 4, 4, 0, TAU);
        g.fill();
      }
    } else if (def?.category === "科技") {
      g.strokeStyle = accent;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, -size * 0.06, size * 0.35, 0, TAU);
      g.stroke();
      g.beginPath();
      g.moveTo(-size * 0.35, -size * 0.06);
      g.lineTo(size * 0.35, -size * 0.06);
      g.moveTo(0, -size * 0.42);
      g.lineTo(0, size * 0.3);
      g.stroke();
    } else if (def?.category === "军队") {
      g.strokeStyle = accent;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(-size * 0.42, size * 0.38);
      g.lineTo(size * 0.42, -size * 0.36);
      g.moveTo(size * 0.42, size * 0.38);
      g.lineTo(-size * 0.42, -size * 0.36);
      g.stroke();
    }
    g.fillStyle = "rgba(255,238,180,.72)";
    g.font = "900 13px sans-serif";
    g.textAlign = "center";
    g.fillText(def?.name?.slice(0, 4) || id, 0, size * 0.82);
  }

  function drawUnitAsset(g, id, w, h, color, accent) {
    const def = UNITS[id];
    g.translate(w / 2, h / 2 + 4);
    g.fillStyle = "rgba(0,0,0,.18)";
    ellipse(g, 0, 18, w * 0.26, 6);
    g.fill();
    const scale = Math.min(w, h) * 0.34;
    if (def?.tags?.includes("ship")) {
      g.fillStyle = "#5b4330";
      g.beginPath();
      g.moveTo(-scale, 10);
      g.lineTo(scale, 10);
      g.lineTo(scale * 0.72, 24);
      g.lineTo(-scale * 0.72, 24);
      g.closePath();
      g.fill();
      g.fillStyle = color;
      g.fillRect(-scale * 0.38, -18, scale * 0.76, 28);
      g.strokeStyle = accent;
      g.strokeRect(-scale * 0.38, -18, scale * 0.76, 28);
    } else if (def?.tags?.includes("mechanical") || def?.tags?.includes("vehicle")) {
      g.fillStyle = "#4d5658";
      roundRect(g, -scale, -8, scale * 2, scale * 0.9, 4);
      g.fill();
      g.fillStyle = color;
      roundRect(g, -scale * 0.55, -scale * 0.74, scale * 1.1, scale * 0.72, 4);
      g.fill();
      g.strokeStyle = accent;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(scale * 0.2, -scale * 0.44);
      g.lineTo(scale * 1.12, -scale * 0.72);
      g.stroke();
      g.fillStyle = "#222";
      for (let i = -1; i <= 1; i += 2) {
        g.beginPath();
        g.arc(i * scale * 0.62, scale * 0.4, 5, 0, TAU);
        g.fill();
      }
    } else if (def?.tags?.includes("beast")) {
      g.fillStyle = color;
      ellipse(g, 0, 2, scale * 0.95, scale * 0.48);
      g.fill();
      g.fillStyle = accent;
      ellipse(g, scale * 0.65, -scale * 0.24, scale * 0.32, scale * 0.28);
      g.fill();
      g.strokeStyle = "#2b1b13";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-scale * 0.7, -scale * 0.15);
      g.lineTo(-scale * 1.05, -scale * 0.45);
      g.moveTo(-scale * 0.15, scale * 0.35);
      g.lineTo(-scale * 0.25, scale * 0.9);
      g.moveTo(scale * 0.42, scale * 0.35);
      g.lineTo(scale * 0.52, scale * 0.9);
      g.stroke();
    } else if (def?.tags?.includes("flying")) {
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(0, -scale);
      g.lineTo(scale * 0.32, scale * 0.12);
      g.lineTo(scale * 1.2, scale * 0.35);
      g.lineTo(scale * 0.12, scale * 0.5);
      g.lineTo(0, scale * 1.02);
      g.lineTo(-scale * 0.12, scale * 0.5);
      g.lineTo(-scale * 1.2, scale * 0.35);
      g.lineTo(-scale * 0.32, scale * 0.12);
      g.closePath();
      g.fill();
      g.strokeStyle = accent;
      g.stroke();
    } else if (def?.tags?.includes("element")) {
      const eColor = elementColor(def.element);
      g.fillStyle = eColor;
      g.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + i / 7 * TAU;
        const r = i % 2 ? scale * 0.55 : scale;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
      g.strokeStyle = accent;
      g.stroke();
    } else {
      g.fillStyle = color;
      g.beginPath();
      g.arc(0, -scale * 0.62, scale * 0.32, 0, TAU);
      g.fill();
      g.fillStyle = "#4d3322";
      g.fillRect(-scale * 0.35, -scale * 0.25, scale * 0.7, scale * 0.95);
      g.strokeStyle = accent;
      g.lineWidth = 3;
      g.beginPath();
      if (def?.tags?.includes("archer") || def?.tags?.includes("ranged")) {
        g.arc(scale * 0.4, 0, scale * 0.6, -Math.PI / 2, Math.PI / 2);
        g.moveTo(-scale * 0.7, -scale * 0.2);
        g.lineTo(scale * 0.78, -scale * 0.2);
      } else {
        g.moveTo(-scale * 0.65, scale * 0.45);
        g.lineTo(scale * 0.65, -scale * 0.48);
      }
      g.stroke();
    }
    g.fillStyle = "rgba(255,238,180,.78)";
    g.font = "900 12px sans-serif";
    g.textAlign = "center";
    g.fillText(def?.name?.slice(0, 4) || id, 0, h / 2 - 4);
  }

  function drawAssetBackdrop(g, w, h, color, accent, kind) {
    g.save();
    roundRect(g, 0, 0, w, h, 6);
    g.clip();
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#f3dfb5");
    bg.addColorStop(0.45, "#d7af72");
    bg.addColorStop(1, "#725238");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = withAlpha(color, kind === "unit" ? 0.16 : 0.2);
    g.beginPath();
    g.ellipse(w * 0.72, h * 0.2, w * 0.42, h * 0.34, -0.25, 0, TAU);
    g.fill();
    g.fillStyle = withAlpha(accent, 0.14);
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.arc((i * 37 + w * 0.18) % w, h * (0.22 + (i % 3) * 0.2), 2 + (i % 3), 0, TAU);
      g.fill();
    }
    g.strokeStyle = "rgba(56,34,18,.22)";
    g.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      g.beginPath();
      g.moveTo(w * i / 4, 4);
      g.lineTo(w * i / 4 - w * 0.2, h - 4);
      g.stroke();
    }
    const vignette = g.createRadialGradient(w * 0.5, h * 0.45, h * 0.15, w * 0.5, h * 0.45, h * 0.82);
    vignette.addColorStop(0, "rgba(255,255,255,0)");
    vignette.addColorStop(1, "rgba(24,14,8,.36)");
    g.fillStyle = vignette;
    g.fillRect(0, 0, w, h);
    g.restore();
    g.strokeStyle = "rgba(50,30,16,.56)";
    g.lineWidth = 1;
    roundRect(g, 0.5, 0.5, w - 1, h - 1, 6);
    g.stroke();
    g.strokeStyle = withAlpha(accent, 0.34);
    roundRect(g, 3.5, 3.5, w - 7, h - 7, 4);
    g.stroke();
  }

  function drawBuildingAssetHQ(g, id, w, h, color, accent) {
    const def = BUILDINGS[id] || {};
    const profile = buildingArtProfile(id);
    const s = Math.min(w, h) / 72;
    g.save();
    g.translate(w / 2, h / 2 + 8 * s);
    drawSoftGround(g, 0, 23 * s, w * 0.36, h * 0.12);
    drawIsoPad(g, 0, 19 * s, w * 0.52, h * 0.17, "#907153", "#513826", accent);
    if (profile === "palace") drawPalaceIcon(g, s, color, accent);
    else if (profile === "house") drawHouseIcon(g, s, color, accent);
    else if (profile === "wood") drawResourceIcon(g, s, color, accent, "wood");
    else if (profile === "stone") drawResourceIcon(g, s, color, accent, "stone");
    else if (profile === "gold") drawResourceIcon(g, s, color, accent, "gold");
    else if (profile === "metal") drawResourceIcon(g, s, color, accent, "metal");
    else if (profile === "military") drawMilitaryIcon(g, s, color, accent, id);
    else if (profile === "tech") drawTechIcon(g, s, color, accent, id);
    else if (profile === "defense") drawDefenseIcon(g, s, color, accent, id);
    else if (profile === "mech") drawMechBuildingIcon(g, s, color, accent, id);
    else if (profile === "beast") drawBeastBuildingIcon(g, s, color, accent, id);
    else if (profile === "nature") drawNatureBuildingIcon(g, s, color, accent, id);
    else if (profile === "hybrid") drawHybridBuildingIcon(g, s, color, accent, id);
    else drawHouseIcon(g, s, color, accent);
    drawAssetStamp(g, def.name || id, w, h, accent);
    g.restore();
  }

  function buildingArtProfile(id) {
    if (["townCenter", "fusionCore"].includes(id)) return id === "fusionCore" ? "hybrid" : "palace";
    if (id === "house") return "house";
    if (["lumberCamp"].includes(id)) return "wood";
    if (["quarry"].includes(id)) return "stone";
    if (["mint"].includes(id)) return "gold";
    if (["ironworks"].includes(id)) return "metal";
    if (["barracks", "stable", "skyCamp", "dock", "siegeWorkshop", "logistics"].includes(id)) return "military";
    if (["dojo", "formationAltar", "beacon", "skyTower", "navyOffice"].includes(id)) return "tech";
    if (["tower", "wall", "gate"].includes(id)) return "defense";
    if (["powerPlant", "pylon", "factory", "mechYard", "lab", "modifyShop", "mechTurret"].includes(id)) return "mech";
    if (["beastNest", "beastDen", "bloodPool", "boneTower"].includes(id)) return "beast";
    if (["waterPool", "fireForge", "earthAltar", "metalCourt", "woodGarden", "fusionAltar", "springRing", "rootTower"].includes(id)) return "nature";
    if (["hybridStable", "hybridLab", "hybridTower"].includes(id)) return "hybrid";
    return "house";
  }

  function drawUnitAssetHQ(g, id, w, h, color, accent) {
    const def = UNITS[id] || {};
    const tags = def.tags || [];
    const s = Math.min(w, h) / 72;
    g.save();
    g.translate(w / 2, h / 2 + 9 * s);
    drawSoftGround(g, 0, 19 * s, w * 0.27, h * 0.09);
    if (tags.includes("ship")) drawShipUnitIcon(g, id, s, color, accent);
    else if (tags.includes("siege") || ["ram", "catapult", "ladderCart", "pierceCart", "fireCart"].includes(id)) drawSiegeUnitIcon(g, id, s, color, accent);
    else if (tags.includes("cavalry") || id.includes("Cavalry") || id === "beastCavalry") drawCavalryUnitIcon(g, id, s, color, accent);
    else if (tags.includes("flying")) drawFlyingUnitIcon(g, id, s, color, accent);
    else if (tags.includes("mechanical") || tags.includes("vehicle") || id.includes("Mech") || id.includes("Bot")) drawMechUnitIcon(g, id, s, color, accent);
    else if (tags.includes("beast")) drawBeastUnitIcon(g, id, s, color, accent);
    else if (tags.includes("element") || def.element || tags.includes("fusion")) drawElementUnitIcon(g, id, s, color, accent);
    else if (tags.includes("support") || ["supplyCart", "medic", "repairCart", "drumCart", "bannerCart"].includes(id)) drawSupportUnitIcon(g, id, s, color, accent);
    else drawHumanUnitIcon(g, id, s, color, accent);
    drawAssetStamp(g, def.name || id, w, h, accent);
    g.restore();
  }

  function drawSoftGround(g, x, y, rx, ry) {
    g.save();
    const shadow = g.createRadialGradient(x, y, 1, x, y, rx);
    shadow.addColorStop(0, "rgba(0,0,0,.28)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = shadow;
    ellipse(g, x, y, rx, ry);
    g.fill();
    g.restore();
  }

  function drawIsoPad(g, x, y, w, h, top, side, trim) {
    g.save();
    g.fillStyle = side;
    g.beginPath();
    g.moveTo(x - w / 2, y);
    g.lineTo(x, y + h / 2);
    g.lineTo(x + w / 2, y);
    g.lineTo(x + w / 2, y + h * 0.42);
    g.lineTo(x, y + h);
    g.lineTo(x - w / 2, y + h * 0.42);
    g.closePath();
    g.fill();
    const grd = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    grd.addColorStop(0, lighten(top, 0.18));
    grd.addColorStop(1, top);
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(x, y - h * 0.54);
    g.lineTo(x + w / 2, y);
    g.lineTo(x, y + h * 0.54);
    g.lineTo(x - w / 2, y);
    g.closePath();
    g.fill();
    g.strokeStyle = withAlpha(trim, 0.45);
    g.lineWidth = 1.5;
    g.stroke();
    g.restore();
  }

  function drawPalaceIcon(g, s, color, accent) {
    drawTempleTier(g, 0, 10 * s, 56 * s, 22 * s, color, accent, "#7a5031");
    drawTempleTier(g, 0, -7 * s, 42 * s, 18 * s, color, accent, "#6d432b");
    drawTempleTier(g, 0, -21 * s, 28 * s, 14 * s, color, accent, "#5a3825");
    drawFlag(g, -25 * s, -23 * s, 20 * s, color, accent);
    drawFlag(g, 25 * s, -23 * s, 20 * s, color, accent);
    drawGoldDot(g, 0, -39 * s, 4 * s, accent);
  }

  function drawHouseIcon(g, s, color, accent) {
    drawTempleTier(g, 0, 5 * s, 42 * s, 24 * s, color, accent, "#744b32");
    g.fillStyle = "#2f2118";
    roundRect(g, -5 * s, 5 * s, 10 * s, 15 * s, 2 * s);
    g.fill();
    drawWindow(g, -15 * s, 4 * s, 6 * s, accent);
    drawWindow(g, 15 * s, 4 * s, 6 * s, accent);
  }

  function drawResourceIcon(g, s, color, accent, kind) {
    drawTempleTier(g, -5 * s, 2 * s, 38 * s, 22 * s, color, accent, "#714a31");
    if (kind === "wood") {
      for (let i = 0; i < 4; i++) drawLog(g, -22 * s + i * 12 * s, 20 * s, 15 * s, 5 * s);
      drawTool(g, 20 * s, -3 * s, 18 * s, "#583620", accent, "axe");
    } else if (kind === "stone") {
      for (let i = 0; i < 5; i++) drawRock(g, -22 * s + i * 10 * s, 17 * s - (i % 2) * 5 * s, 8 * s, "#b9b4a4");
      drawTool(g, 18 * s, -4 * s, 18 * s, "#4f3829", accent, "pick");
    } else if (kind === "gold") {
      for (let i = 0; i < 5; i++) drawGoldDot(g, -20 * s + i * 10 * s, 17 * s - (i % 2) * 4 * s, 5 * s, "#e4bd55");
      drawWindow(g, 0, -2 * s, 9 * s, "#f5d977");
    } else {
      drawChimney(g, 16 * s, -18 * s, 8 * s, 26 * s, "#4a4540", "#ef7d3d");
      for (let i = 0; i < 4; i++) drawIngot(g, -18 * s + i * 12 * s, 18 * s, 10 * s, "#bfc7c9");
    }
  }

  function drawMilitaryIcon(g, s, color, accent, id) {
    if (id === "dock") {
      drawShipHull(g, 0, 14 * s, 58 * s, 18 * s, "#5b3927", accent);
      drawMast(g, -5 * s, 2 * s, 32 * s, color, accent);
      drawWaveLines(g, 0, 25 * s, 46 * s, "#77bfd6");
      return;
    }
    drawTempleTier(g, 0, 5 * s, 48 * s, 24 * s, color, accent, "#6f452e");
    if (id === "stable") {
      drawHorseHead(g, 5 * s, 5 * s, 15 * s, "#5d3523", accent);
      drawFlag(g, -24 * s, -18 * s, 17 * s, color, accent);
    } else if (id === "skyCamp") {
      drawWing(g, -18 * s, -2 * s, 22 * s, color, accent, -1);
      drawWing(g, 18 * s, -2 * s, 22 * s, color, accent, 1);
      drawFlag(g, 0, -24 * s, 19 * s, color, accent);
    } else if (id === "siegeWorkshop") {
      drawWheel(g, -17 * s, 18 * s, 6 * s, "#2b211a", accent);
      drawWheel(g, 17 * s, 18 * s, 6 * s, "#2b211a", accent);
      drawTool(g, 4 * s, -10 * s, 26 * s, "#5f3b23", accent, "hammer");
    } else if (id === "logistics") {
      drawMiniCart(g, 0, 15 * s, 34 * s, 14 * s, color, accent);
      drawFlag(g, 22 * s, -15 * s, 20 * s, color, accent);
    } else {
      drawCrossedWeapons(g, 0, -3 * s, 32 * s, accent);
      drawFlag(g, -24 * s, -17 * s, 18 * s, color, accent);
      drawFlag(g, 24 * s, -17 * s, 18 * s, color, accent);
    }
  }

  function drawTechIcon(g, s, color, accent, id) {
    if (id === "beacon") {
      drawTowerBody(g, 0, 2 * s, 18 * s, 48 * s, "#675042", color, accent);
      drawFlame(g, 0, -28 * s, 12 * s, "#ff8a42", "#ffd66e");
      return;
    }
    drawPillars(g, -20 * s, 9 * s, 12 * s, 28 * s, "#73523a", accent);
    drawPillars(g, 20 * s, 9 * s, 12 * s, 28 * s, "#73523a", accent);
    drawIsoPad(g, 0, 8 * s, 42 * s, 18 * s, "#9b784d", "#5a3f2d", accent);
    if (id === "formationAltar") drawCompass(g, 0, -8 * s, 18 * s, color, accent);
    else if (id === "skyTower") drawOrbital(g, 0, -15 * s, 24 * s, color, accent);
    else if (id === "navyOffice") {
      drawWaveLines(g, 0, 12 * s, 44 * s, "#76c4dd");
      drawMast(g, 0, -4 * s, 30 * s, color, accent);
    } else drawCompass(g, 0, -7 * s, 20 * s, color, accent);
  }

  function drawDefenseIcon(g, s, color, accent, id) {
    if (id === "wall") {
      for (let i = -2; i <= 2; i++) drawBattlement(g, i * 13 * s, 3 * s, 12 * s, 26 * s, "#81705f", accent);
      return;
    }
    if (id === "gate") {
      drawBattlement(g, -17 * s, 1 * s, 14 * s, 34 * s, "#776453", accent);
      drawBattlement(g, 17 * s, 1 * s, 14 * s, 34 * s, "#776453", accent);
      g.fillStyle = "#3b2920";
      roundRect(g, -12 * s, -1 * s, 24 * s, 28 * s, 3 * s);
      g.fill();
      g.strokeStyle = accent;
      g.stroke();
      return;
    }
    drawTowerBody(g, 0, 0, 22 * s, 48 * s, "#706051", color, accent);
    drawCrossbowTop(g, 0, -27 * s, 28 * s, accent);
  }

  function drawMechBuildingIcon(g, s, color, accent, id) {
    const metal = "#59666b";
    if (id === "pylon") {
      drawEnergyTower(g, 0, 0, 48 * s, color, accent);
      return;
    }
    drawMetalBlock(g, 0, 7 * s, 50 * s, 27 * s, metal, color, accent);
    if (id === "powerPlant") {
      drawChimney(g, -15 * s, -20 * s, 8 * s, 34 * s, "#3b4548", "#7ed1ff");
      drawChimney(g, 14 * s, -15 * s, 8 * s, 28 * s, "#3b4548", "#7ed1ff");
      drawBolt(g, 0, -10 * s, 20 * s, accent);
    } else if (id === "factory" || id === "mechYard") {
      drawGear(g, -17 * s, -6 * s, 10 * s, accent);
      drawGear(g, 15 * s, 7 * s, 8 * s, color);
      drawPipe(g, -25 * s, 0, 50 * s, "#2f3a3d", accent);
    } else if (id === "lab" || id === "modifyShop") {
      drawOrbital(g, 0, -15 * s, 22 * s, color, accent);
      drawWindow(g, -17 * s, 8 * s, 7 * s, "#80d9ff");
      drawWindow(g, 17 * s, 8 * s, 7 * s, "#80d9ff");
    } else {
      drawCannon(g, 0, -8 * s, 34 * s, "#394246", accent);
      drawGear(g, 0, 13 * s, 9 * s, accent);
    }
  }

  function drawBeastBuildingIcon(g, s, color, accent, id) {
    const flesh = id === "bloodPool" ? "#7d2925" : "#6d3f2f";
    drawOrganicMound(g, 0, 10 * s, 52 * s, 28 * s, flesh, color, accent);
    if (id === "bloodPool") {
      g.fillStyle = "#9d2927";
      ellipse(g, 0, 9 * s, 22 * s, 8 * s);
      g.fill();
      drawBubbleDots(g, 0, 4 * s, 22 * s, "#e15f4e");
    } else if (id === "boneTower") {
      drawBoneSpire(g, 0, -12 * s, 42 * s, "#d6c5a5", accent);
    } else if (id === "beastDen") {
      drawClaws(g, 0, -11 * s, 32 * s, "#dfc8a4");
      drawFlame(g, 0, -1 * s, 12 * s, "#9b3a2e", "#ffb36e");
    } else {
      drawSpikes(g, 0, -8 * s, 46 * s, "#d5c09d");
      drawBubbleDots(g, 0, 3 * s, 30 * s, accent);
    }
  }

  function drawNatureBuildingIcon(g, s, color, accent, id) {
    const e = natureElementForBuilding(id);
    const eColor = elementColor(e);
    if (id === "rootTower") {
      drawTreeTower(g, 0, 0, 52 * s, eColor, accent);
      return;
    }
    drawIsoPad(g, 0, 11 * s, 48 * s, 18 * s, lighten(eColor, 0.05), "#4b3d2b", accent);
    drawCrystalCluster(g, 0, -8 * s, 30 * s, eColor, accent, e);
    if (id === "waterPool" || id === "springRing") drawWaveLines(g, 0, 15 * s, 44 * s, "#8addff");
    if (id === "fireForge") drawFlame(g, 0, -19 * s, 13 * s, "#e65d39", "#ffd36c");
    if (id === "earthAltar") drawRock(g, -20 * s, 10 * s, 10 * s, "#a78658");
    if (id === "metalCourt") drawBladeGlyph(g, 20 * s, -1 * s, 24 * s, "#e4ecee");
    if (id === "woodGarden") drawLeaves(g, 0, -18 * s, 28 * s, "#62b25f");
    if (id === "fusionAltar") drawOrbital(g, 0, -7 * s, 30 * s, color, accent);
  }

  function drawHybridBuildingIcon(g, s, color, accent, id) {
    drawMetalBlock(g, -4 * s, 8 * s, 52 * s, 28 * s, "#655162", color, accent);
    drawTempleTier(g, 0, -6 * s, 34 * s, 18 * s, color, accent, "#563b3f");
    drawCrystalCluster(g, 15 * s, -16 * s, 19 * s, "#9d79e6", accent, "fusion");
    drawPipe(g, -24 * s, 4 * s, 45 * s, "#3b313e", accent);
    if (id === "hybridStable") drawHorseHead(g, -10 * s, 8 * s, 14 * s, "#51352f", accent);
    if (id === "hybridLab" || id === "fusionCore") drawOrbital(g, -4 * s, -15 * s, 24 * s, color, accent);
    if (id === "hybridTower") drawCannon(g, 0, -20 * s, 32 * s, "#3d3445", accent);
  }

  function drawHumanUnitIcon(g, id, s, color, accent) {
    const weapon = unitWeapon(id);
    const armor = unitArmorTone(id);
    drawHumanBody(g, 0, 0, 1, armor, color, accent);
    if (weapon === "bow") drawBow(g, 19 * s, -4 * s, 25 * s, accent);
    else if (weapon === "spear") drawSpear(g, 20 * s, -3 * s, 36 * s, accent);
    else if (weapon === "shield") drawShield(g, -16 * s, 4 * s, 13 * s, color, accent);
    else if (weapon === "crossbow") drawCrossbowTop(g, 16 * s, 0, 21 * s, accent);
    else if (weapon === "tool") drawTool(g, 17 * s, 2 * s, 22 * s, "#4a2d1b", accent, id === "worker" ? "pick" : "wrench");
    else if (weapon === "banner") drawFlag(g, 18 * s, -17 * s, 28 * s, color, accent);
    else drawSword(g, 18 * s, -2 * s, 26 * s, accent);
    if (id === "guard") drawCrest(g, 0, -27 * s, 7 * s, accent);
  }

  function drawSupportUnitIcon(g, id, s, color, accent) {
    if (["supplyCart", "repairCart", "drumCart", "bannerCart"].includes(id)) {
      drawMiniCart(g, 0, 9 * s, 42 * s, 17 * s, color, accent);
      if (id === "repairCart") drawTool(g, 3 * s, -8 * s, 24 * s, "#4d3322", accent, "wrench");
      else if (id === "drumCart") drawDrum(g, 0, -4 * s, 17 * s, "#7a422a", accent);
      else if (id === "bannerCart") drawFlag(g, 17 * s, -22 * s, 28 * s, color, accent);
      else drawCrate(g, 0, -5 * s, 24 * s, "#8a6038", accent);
      return;
    }
    drawHumanBody(g, 0, 0, 1, "#675242", color, accent);
    drawStaff(g, 18 * s, -4 * s, 32 * s, accent);
    drawGoldDot(g, -12 * s, 3 * s, 4 * s, "#78d47d");
  }

  function drawCavalryUnitIcon(g, id, s, color, accent) {
    const horse = id === "blackCavalry" ? "#252528" : id === "beastCavalry" ? "#6e3b30" : "#6b452e";
    drawHorseBody(g, -2 * s, 8 * s, 42 * s, 22 * s, horse, accent);
    drawHumanBody(g, -2 * s, -11 * s, 0.72, unitArmorTone(id), color, accent);
    if (id.includes("scout") || id.includes("light")) drawSpear(g, 20 * s, -10 * s, 37 * s, accent);
    else if (id.includes("raider")) drawBow(g, 21 * s, -9 * s, 24 * s, accent);
    else drawLance(g, 24 * s, -15 * s, 44 * s, accent);
    if (id === "beastCavalry") drawHorn(g, 20 * s, 0, 10 * s, accent);
  }

  function drawFlyingUnitIcon(g, id, s, color, accent) {
    drawWing(g, -18 * s, 0, 30 * s, color, accent, -1);
    drawWing(g, 18 * s, 0, 30 * s, color, accent, 1);
    drawBirdBody(g, 0, 3 * s, 32 * s, color, accent);
    if (id.includes("Bolter") || id.includes("anti")) drawCrossbowTop(g, 6 * s, -8 * s, 24 * s, accent);
    if (id.includes("armor") || id.includes("Marshal")) drawShield(g, 0, 3 * s, 12 * s, color, accent);
  }

  function drawShipUnitIcon(g, id, s, color, accent) {
    drawShipHull(g, 0, 8 * s, 58 * s, 20 * s, "#53341f", accent);
    if (id === "transportBoat") drawCrate(g, 0, -4 * s, 24 * s, "#8a6038", accent);
    else if (id === "towerShip") drawTowerBody(g, 0, -8 * s, 13 * s, 30 * s, "#6f5d4d", color, accent);
    else if (id === "rocketBoat") drawRocketRack(g, 0, -8 * s, 34 * s, accent);
    else if (id === "dragonShip") drawDragonProw(g, 22 * s, -1 * s, 22 * s, accent);
    else if (id === "boltBoat") drawCrossbowTop(g, 0, -9 * s, 30 * s, accent);
    else drawMast(g, 0, -6 * s, 30 * s, color, accent);
    drawWaveLines(g, 0, 20 * s, 50 * s, "#80cce0");
  }

  function drawSiegeUnitIcon(g, id, s, color, accent) {
    drawMiniCart(g, 0, 11 * s, 46 * s, 17 * s, "#6e4930", accent);
    if (id === "ram") drawRamHead(g, 11 * s, -3 * s, 34 * s, accent);
    else if (id === "catapult") drawCatapultArm(g, 0, -9 * s, 36 * s, accent);
    else if (id === "ladderCart") drawLadder(g, 0, -13 * s, 42 * s, accent);
    else if (id === "pierceCart") drawBallista(g, 0, -8 * s, 42 * s, accent);
    else drawFirePot(g, 0, -9 * s, 16 * s, "#f0783f", "#ffd36e");
  }

  function drawMechUnitIcon(g, id, s, color, accent) {
    if (id === "mechDog") {
      drawMechQuadruped(g, 0, 5 * s, 42 * s, color, accent);
      return;
    }
    if (id === "machineWorker" || id === "engineTruck") {
      drawMiniCart(g, 0, 10 * s, 40 * s, 17 * s, "#4e5b5f", accent);
      drawRobotTorso(g, 0, -7 * s, 20 * s, color, accent);
      drawTool(g, 17 * s, -3 * s, 23 * s, "#3e4547", accent, "wrench");
      return;
    }
    if (id === "tank" || id === "aaTruck" || id === "armorCar" || id === "fortressCar") {
      drawTrackedVehicle(g, 0, 9 * s, 48 * s, 21 * s, "#465155", color, accent);
      if (id === "tank") drawCannon(g, 8 * s, -9 * s, 36 * s, "#303b40", accent);
      else if (id === "aaTruck") drawRocketRack(g, 2 * s, -12 * s, 34 * s, accent);
      else if (id === "fortressCar") drawTowerBody(g, 0, -8 * s, 14 * s, 30 * s, "#3e494d", color, accent);
      else drawCannon(g, 8 * s, -7 * s, 28 * s, "#303b40", accent);
      return;
    }
    drawMechSuit(g, 0, 2 * s, id === "gundam" ? 40 * s : 34 * s, color, accent);
    if (id === "arrayBot") drawGear(g, 0, -18 * s, 8 * s, accent);
    if (id === "spiritMech") drawCrystalCluster(g, 14 * s, -13 * s, 13 * s, "#9d79e6", accent, "fusion");
  }

  function drawBeastUnitIcon(g, id, s, color, accent) {
    if (id.includes("Bug") || id === "mechBug") {
      const bugColor = id === "burstBug" ? "#a53b31" : id === "stingerBug" ? "#59602e" : color;
      drawBug(g, 0, 5 * s, id === "motherBug" ? 44 * s : 32 * s, bugColor, accent);
      if (id === "burstBug") drawBubbleDots(g, 0, 2 * s, 25 * s, "#ff9a55");
      if (id === "stingerBug") drawSpikes(g, 0, -9 * s, 33 * s, "#ded0a9");
      return;
    }
    if (id === "taotie" || id === "mammothBeast") {
      drawLargeBeast(g, 0, 5 * s, 48 * s, color, accent, id === "mammothBeast");
      return;
    }
    if (id === "shadowWolf") drawWolf(g, 0, 4 * s, 38 * s, "#2d3134", accent);
    else drawTiger(g, 0, 5 * s, 39 * s, color, accent);
  }

  function drawElementUnitIcon(g, id, s, color, accent) {
    const def = UNITS[id] || {};
    const e = def.element || elementFromUnitId(id);
    const eColor = elementColor(e);
    drawElementAura(g, 0, 2 * s, 34 * s, eColor);
    if (id.includes("Giant") || id.includes("Guard") || id.includes("Turtle") || id.includes("Elder")) {
      drawCrystalGolem(g, 0, 3 * s, 38 * s, eColor, accent, e);
    } else {
      drawSpiritBody(g, 0, 2 * s, 30 * s, eColor, accent, e);
    }
    if (id.includes("hybrid") || ["fiveElementSoldier", "woodTiger"].includes(id)) drawOrbital(g, 0, -5 * s, 26 * s, color, accent);
  }

  function drawTempleTier(g, x, y, w, h, roof, trim, wall) {
    g.save();
    g.fillStyle = wall;
    roundRect(g, x - w * 0.38, y - h * 0.08, w * 0.76, h * 0.66, 2);
    g.fill();
    g.strokeStyle = "rgba(35,22,13,.35)";
    g.stroke();
    const roofGrad = g.createLinearGradient(x - w / 2, y - h * 0.6, x + w / 2, y);
    roofGrad.addColorStop(0, lighten(roof, 0.14));
    roofGrad.addColorStop(1, darken(roof, 0.16));
    g.fillStyle = roofGrad;
    g.beginPath();
    g.moveTo(x - w / 2, y - h * 0.08);
    g.lineTo(x, y - h * 0.68);
    g.lineTo(x + w / 2, y - h * 0.08);
    g.lineTo(x + w * 0.42, y + h * 0.08);
    g.lineTo(x - w * 0.42, y + h * 0.08);
    g.closePath();
    g.fill();
    g.strokeStyle = trim;
    g.lineWidth = 1.6;
    g.stroke();
    g.fillStyle = withAlpha(trim, 0.8);
    g.fillRect(x - w * 0.42, y + h * 0.05, w * 0.84, Math.max(2, h * 0.08));
    g.restore();
  }

  function drawAssetStamp(g, text, w, h, accent) {
    if (w < 86) return;
    g.save();
    const label = String(text).slice(0, 3);
    g.font = "900 11px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const tw = Math.min(w - 18, g.measureText(label).width + 16);
    g.fillStyle = "rgba(24,16,10,.58)";
    roundRect(g, -tw / 2, h / 2 - 15, tw, 15, 3);
    g.fill();
    g.strokeStyle = withAlpha(accent, 0.55);
    g.stroke();
    g.fillStyle = "#ffe7b7";
    g.fillText(label, 0, h / 2 - 7.5);
    g.restore();
  }

  function natureElementForBuilding(id) {
    if (id.includes("water") || id === "springRing") return "water";
    if (id.includes("fire")) return "fire";
    if (id.includes("earth")) return "earth";
    if (id.includes("metal")) return "metal";
    if (id.includes("wood") || id === "rootTower") return "wood";
    return "fusion";
  }

  function elementFromUnitId(id) {
    if (id.toLowerCase().includes("water") || id.toLowerCase().includes("rain") || id.toLowerCase().includes("ice") || id.toLowerCase().includes("tide")) return "water";
    if (id.toLowerCase().includes("fire") || id.toLowerCase().includes("ember") || id.toLowerCase().includes("flame")) return "fire";
    if (id.toLowerCase().includes("earth") || id.toLowerCase().includes("stone") || id.toLowerCase().includes("mountain") || id.toLowerCase().includes("mud")) return "earth";
    if (id.toLowerCase().includes("metal") || id.toLowerCase().includes("blade") || id.toLowerCase().includes("gold") || id.toLowerCase().includes("rockGold")) return "metal";
    if (id.toLowerCase().includes("wood") || id.toLowerCase().includes("root") || id.toLowerCase().includes("tree")) return "wood";
    return "fusion";
  }

  function unitWeapon(id) {
    if (id === "worker" || id === "engineer") return "tool";
    if (id.includes("archer") || id.includes("Archer") || id === "musket") return id === "musket" ? "crossbow" : "bow";
    if (id.includes("spearman") || id.includes("Spear")) return "spear";
    if (id.includes("shield") || id.includes("Shield")) return "shield";
    if (id.includes("antiAir") || id.includes("crossbow") || id.includes("Crossbow")) return "crossbow";
    if (id.includes("guard") || id.includes("Guard")) return "spear";
    if (id.includes("banner")) return "banner";
    return "sword";
  }

  function unitArmorTone(id) {
    if (id.includes("guard") || id.includes("shield") || id.includes("heavy")) return "#5d6265";
    if (id.includes("engineer") || id.includes("worker")) return "#5f4936";
    if (id.includes("musket")) return "#4b3530";
    return "#4e5f72";
  }

  function drawHumanBody(g, x, y, scale, armor, color, accent) {
    const s = Math.min(1.3, Math.max(0.55, scale));
    g.save();
    g.translate(x, y);
    drawLegs(g, 0, 12 * s, 12 * s, armor);
    const body = g.createLinearGradient(-10 * s, -12 * s, 10 * s, 12 * s);
    body.addColorStop(0, lighten(color, 0.12));
    body.addColorStop(1, darken(armor, 0.12));
    g.fillStyle = body;
    roundRect(g, -10 * s, -14 * s, 20 * s, 27 * s, 5 * s);
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 1.5 * s;
    g.stroke();
    g.fillStyle = "#c89b6a";
    ellipse(g, 0, -25 * s, 7 * s, 8 * s);
    g.fill();
    g.fillStyle = darken(color, 0.2);
    g.beginPath();
    g.moveTo(-9 * s, -27 * s);
    g.quadraticCurveTo(0, -36 * s, 9 * s, -27 * s);
    g.lineTo(7 * s, -22 * s);
    g.lineTo(-7 * s, -22 * s);
    g.closePath();
    g.fill();
    drawArm(g, -12 * s, -5 * s, -20 * s, 8 * s, armor);
    drawArm(g, 12 * s, -5 * s, 20 * s, 8 * s, armor);
    g.restore();
  }

  function drawLegs(g, x, y, len, armor) {
    g.strokeStyle = darken(armor, 0.24);
    g.lineWidth = Math.max(2, len * 0.22);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x - len * 0.25, y - len * 0.6);
    g.lineTo(x - len * 0.45, y + len * 0.25);
    g.moveTo(x + len * 0.25, y - len * 0.6);
    g.lineTo(x + len * 0.45, y + len * 0.25);
    g.stroke();
  }

  function drawArm(g, x1, y1, x2, y2, armor) {
    g.strokeStyle = darken(armor, 0.14);
    g.lineWidth = 3;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  }

  function drawFlag(g, x, y, h, color, accent) {
    g.save();
    g.strokeStyle = "#3b2618";
    g.lineWidth = Math.max(1.2, h * 0.07);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y + h);
    g.stroke();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x, y + h * 0.05);
    g.lineTo(x + h * 0.58, y + h * 0.2);
    g.lineTo(x + h * 0.46, y + h * 0.52);
    g.lineTo(x, y + h * 0.42);
    g.closePath();
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 1;
    g.stroke();
    g.restore();
  }

  function drawWindow(g, x, y, r, glow) {
    g.save();
    g.fillStyle = withAlpha(glow, 0.72);
    roundRect(g, x - r, y - r, r * 2, r * 1.8, Math.max(1, r * 0.25));
    g.fill();
    g.fillStyle = "rgba(255,255,255,.32)";
    g.fillRect(x - r * 0.55, y - r * 0.5, r * 0.35, r * 1.1);
    g.restore();
  }

  function drawLog(g, x, y, w, h) {
    g.save();
    g.fillStyle = "#7b4c28";
    roundRect(g, x - w / 2, y - h / 2, w, h, h / 2);
    g.fill();
    g.strokeStyle = "#3f2414";
    g.stroke();
    g.fillStyle = "#c48a4a";
    ellipse(g, x + w * 0.38, y, h * 0.45, h * 0.45);
    g.fill();
    g.restore();
  }

  function drawRock(g, x, y, r, color) {
    g.save();
    g.fillStyle = color;
    g.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + i / 7 * TAU;
      const rr = r * (0.75 + (i % 3) * 0.13);
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(48,37,25,.38)";
    g.stroke();
    g.restore();
  }

  function drawGoldDot(g, x, y, r, color) {
    const grd = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r);
    grd.addColorStop(0, "#fff0a4");
    grd.addColorStop(1, color);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.strokeStyle = "rgba(80,48,12,.35)";
    g.stroke();
  }

  function drawIngot(g, x, y, w, color) {
    g.save();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x - w / 2, y + w * 0.2);
    g.lineTo(x - w * 0.32, y - w * 0.22);
    g.lineTo(x + w * 0.32, y - w * 0.22);
    g.lineTo(x + w / 2, y + w * 0.2);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(40,45,45,.4)";
    g.stroke();
    g.restore();
  }

  function drawTool(g, x, y, len, shaft, metal, type) {
    g.save();
    g.translate(x, y);
    g.rotate(type === "pick" ? -0.75 : type === "wrench" ? -0.45 : -0.65);
    g.strokeStyle = shaft;
    g.lineWidth = Math.max(2, len * 0.12);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(0, len * 0.5);
    g.lineTo(0, -len * 0.5);
    g.stroke();
    g.strokeStyle = metal;
    g.lineWidth = Math.max(2, len * 0.16);
    g.beginPath();
    if (type === "axe") {
      g.moveTo(0, -len * 0.42);
      g.quadraticCurveTo(len * 0.38, -len * 0.5, len * 0.32, -len * 0.15);
    } else if (type === "wrench") {
      g.arc(0, -len * 0.46, len * 0.18, 0.4, TAU - 0.4);
    } else if (type === "hammer") {
      g.moveTo(-len * 0.3, -len * 0.45);
      g.lineTo(len * 0.3, -len * 0.45);
    } else {
      g.moveTo(-len * 0.32, -len * 0.42);
      g.lineTo(len * 0.32, -len * 0.42);
    }
    g.stroke();
    g.restore();
  }

  function drawChimney(g, x, y, w, h, body, glow) {
    g.save();
    g.fillStyle = body;
    roundRect(g, x - w / 2, y, w, h, 2);
    g.fill();
    g.strokeStyle = "rgba(0,0,0,.35)";
    g.stroke();
    for (let i = 0; i < 3; i++) {
      g.fillStyle = withAlpha(glow, 0.18 - i * 0.04);
      ellipse(g, x + (i - 1) * w * 0.35, y - i * 6, w * (0.6 + i * 0.25), w * 0.4);
      g.fill();
    }
    g.restore();
  }

  function drawCrossedWeapons(g, x, y, len, accent) {
    drawSword(g, x - 6, y + 3, len, accent, -0.75);
    drawSword(g, x + 6, y + 3, len, accent, 0.75);
  }

  function drawSword(g, x, y, len, accent, angle = -0.75) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.strokeStyle = "#e8ecec";
    g.lineWidth = Math.max(2, len * 0.09);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(0, len * 0.35);
    g.lineTo(0, -len * 0.45);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = Math.max(1.5, len * 0.08);
    g.beginPath();
    g.moveTo(-len * 0.18, len * 0.08);
    g.lineTo(len * 0.18, len * 0.08);
    g.stroke();
    g.restore();
  }

  function drawSpear(g, x, y, len, accent) {
    g.save();
    g.translate(x, y);
    g.rotate(-0.55);
    g.strokeStyle = "#5a361f";
    g.lineWidth = Math.max(2, len * 0.07);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(0, len * 0.45);
    g.lineTo(0, -len * 0.45);
    g.stroke();
    g.fillStyle = "#e8ecec";
    g.beginPath();
    g.moveTo(0, -len * 0.62);
    g.lineTo(-len * 0.1, -len * 0.39);
    g.lineTo(len * 0.1, -len * 0.39);
    g.closePath();
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    g.restore();
  }

  function drawLance(g, x, y, len, accent) {
    drawSpear(g, x, y, len, accent);
    drawFlag(g, x + 5, y - len * 0.25, len * 0.28, accent, "#fff0bd");
  }

  function drawBow(g, x, y, len, accent) {
    g.save();
    g.translate(x, y);
    g.strokeStyle = "#5b3522";
    g.lineWidth = Math.max(2, len * 0.08);
    g.beginPath();
    g.arc(0, 0, len * 0.38, -Math.PI / 2, Math.PI / 2);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(0, -len * 0.38);
    g.lineTo(0, len * 0.38);
    g.stroke();
    g.restore();
  }

  function drawShield(g, x, y, r, color, accent) {
    g.save();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x, y - r);
    g.quadraticCurveTo(x + r, y - r * 0.5, x + r * 0.8, y + r * 0.55);
    g.quadraticCurveTo(x, y + r * 1.1, x - r * 0.8, y + r * 0.55);
    g.quadraticCurveTo(x - r, y - r * 0.5, x, y - r);
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 1.4;
    g.stroke();
    g.restore();
  }

  function drawStaff(g, x, y, len, accent) {
    g.save();
    g.translate(x, y);
    g.rotate(0.22);
    g.strokeStyle = "#624022";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, len * 0.48);
    g.lineTo(0, -len * 0.42);
    g.stroke();
    drawGoldDot(g, 0, -len * 0.48, len * 0.12, accent);
    g.restore();
  }

  function drawCrest(g, x, y, r, accent) {
    g.fillStyle = accent;
    g.beginPath();
    g.moveTo(x, y - r);
    g.lineTo(x + r * 0.8, y + r);
    g.lineTo(x, y + r * 0.4);
    g.lineTo(x - r * 0.8, y + r);
    g.closePath();
    g.fill();
  }

  function drawHorseBody(g, x, y, w, h, body, accent) {
    g.save();
    g.fillStyle = body;
    ellipse(g, x, y, w * 0.42, h * 0.42);
    g.fill();
    ellipse(g, x + w * 0.4, y - h * 0.25, w * 0.16, h * 0.24);
    g.fill();
    g.strokeStyle = darken(body, 0.35);
    g.lineWidth = 3;
    g.lineCap = "round";
    for (const lx of [-0.25, 0.08, 0.3]) {
      g.beginPath();
      g.moveTo(x + w * lx, y + h * 0.28);
      g.lineTo(x + w * (lx + 0.05), y + h * 0.72);
      g.stroke();
    }
    g.strokeStyle = accent;
    g.lineWidth = 1.4;
    g.strokeRect(x - w * 0.2, y - h * 0.38, w * 0.34, h * 0.32);
    g.restore();
  }

  function drawHorseHead(g, x, y, r, body, accent) {
    g.save();
    g.fillStyle = body;
    ellipse(g, x, y, r * 0.55, r);
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    drawHorn(g, x + r * 0.15, y - r * 0.7, r * 0.45, accent);
    g.restore();
  }

  function drawHorn(g, x, y, r, accent) {
    g.fillStyle = "#d8c59e";
    g.beginPath();
    g.moveTo(x, y - r);
    g.lineTo(x - r * 0.45, y + r * 0.4);
    g.lineTo(x + r * 0.35, y + r * 0.25);
    g.closePath();
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
  }

  function drawWing(g, x, y, r, color, accent, dir) {
    g.save();
    g.translate(x, y);
    g.scale(dir, 1);
    const grad = g.createLinearGradient(-r, -r * 0.5, r, r * 0.5);
    grad.addColorStop(0, lighten(color, 0.15));
    grad.addColorStop(1, darken(color, 0.12));
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, -r * 0.45);
    g.quadraticCurveTo(r * 0.9, -r * 0.28, r * 1.05, r * 0.42);
    g.quadraticCurveTo(r * 0.42, r * 0.2, 0, r * 0.52);
    g.closePath();
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 1.3;
    g.stroke();
    g.restore();
  }

  function drawBirdBody(g, x, y, w, color, accent) {
    g.save();
    g.fillStyle = darken(color, 0.05);
    ellipse(g, x, y, w * 0.28, w * 0.18);
    g.fill();
    g.fillStyle = accent;
    g.beginPath();
    g.moveTo(x + w * 0.28, y - w * 0.04);
    g.lineTo(x + w * 0.45, y);
    g.lineTo(x + w * 0.28, y + w * 0.04);
    g.fill();
    g.restore();
  }

  function drawShipHull(g, x, y, w, h, body, accent) {
    g.save();
    const grad = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    grad.addColorStop(0, lighten(body, 0.14));
    grad.addColorStop(1, darken(body, 0.16));
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(x - w / 2, y - h * 0.25);
    g.lineTo(x + w / 2, y - h * 0.25);
    g.lineTo(x + w * 0.32, y + h * 0.45);
    g.lineTo(x - w * 0.32, y + h * 0.45);
    g.closePath();
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    g.restore();
  }

  function drawMast(g, x, y, h, color, accent) {
    g.save();
    g.strokeStyle = "#5a3520";
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(x, y + h * 0.5);
    g.lineTo(x, y - h * 0.5);
    g.stroke();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x + 1, y - h * 0.42);
    g.lineTo(x + h * 0.36, y - h * 0.12);
    g.lineTo(x + 1, y + h * 0.12);
    g.closePath();
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    g.restore();
  }

  function drawWaveLines(g, x, y, w, color) {
    g.save();
    g.strokeStyle = withAlpha(color, 0.75);
    g.lineWidth = 1.5;
    for (let j = 0; j < 2; j++) {
      g.beginPath();
      for (let i = 0; i <= 6; i++) {
        const px = x - w / 2 + i * w / 6;
        const py = y + j * 5 + Math.sin(i * 1.7) * 2.2;
        if (!i) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
    }
    g.restore();
  }

  function drawMiniCart(g, x, y, w, h, body, accent) {
    g.save();
    g.fillStyle = body;
    roundRect(g, x - w / 2, y - h, w, h, 3);
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    drawWheel(g, x - w * 0.32, y + 1, h * 0.32, "#26201b", accent);
    drawWheel(g, x + w * 0.32, y + 1, h * 0.32, "#26201b", accent);
    g.restore();
  }

  function drawWheel(g, x, y, r, body, accent) {
    g.save();
    g.fillStyle = body;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    g.beginPath();
    g.arc(x, y, r * 0.42, 0, TAU);
    g.stroke();
    g.restore();
  }

  function drawDrum(g, x, y, r, body, accent) {
    g.save();
    g.fillStyle = body;
    roundRect(g, x - r, y - r * 0.8, r * 2, r * 1.6, 4);
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    g.restore();
  }

  function drawCrate(g, x, y, w, body, accent) {
    g.save();
    g.fillStyle = body;
    roundRect(g, x - w / 2, y - w * 0.35, w, w * 0.7, 2);
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    g.beginPath();
    g.moveTo(x - w / 2, y - w * 0.35);
    g.lineTo(x + w / 2, y + w * 0.35);
    g.moveTo(x + w / 2, y - w * 0.35);
    g.lineTo(x - w / 2, y + w * 0.35);
    g.stroke();
    g.restore();
  }

  function drawTowerBody(g, x, y, w, h, body, roof, accent) {
    g.save();
    g.fillStyle = body;
    roundRect(g, x - w / 2, y - h * 0.35, w, h * 0.72, 3);
    g.fill();
    g.strokeStyle = "rgba(0,0,0,.35)";
    g.stroke();
    g.fillStyle = roof;
    g.beginPath();
    g.moveTo(x - w * 0.75, y - h * 0.35);
    g.lineTo(x, y - h * 0.62);
    g.lineTo(x + w * 0.75, y - h * 0.35);
    g.closePath();
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    g.restore();
  }

  function drawCrossbowTop(g, x, y, w, accent) {
    g.save();
    g.strokeStyle = accent;
    g.lineWidth = Math.max(2, w * 0.08);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x - w * 0.5, y);
    g.lineTo(x + w * 0.5, y);
    g.moveTo(x, y + w * 0.25);
    g.lineTo(x, y - w * 0.38);
    g.stroke();
    g.restore();
  }

  function drawPillars(g, x, y, w, h, body, accent) {
    g.save();
    g.fillStyle = body;
    roundRect(g, x - w / 2, y - h / 2, w, h, 2);
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    g.fillStyle = lighten(body, 0.16);
    g.fillRect(x - w * 0.62, y - h * 0.58, w * 1.24, h * 0.12);
    g.restore();
  }

  function drawCompass(g, x, y, r, color, accent) {
    g.save();
    g.strokeStyle = accent;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.stroke();
    g.fillStyle = color;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      g.beginPath();
      g.moveTo(x + Math.cos(a) * r * 0.15, y + Math.sin(a) * r * 0.15);
      g.lineTo(x + Math.cos(a + 0.28) * r * 0.88, y + Math.sin(a + 0.28) * r * 0.88);
      g.lineTo(x + Math.cos(a - 0.28) * r * 0.88, y + Math.sin(a - 0.28) * r * 0.88);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  function drawOrbital(g, x, y, r, color, accent) {
    g.save();
    drawGoldDot(g, x, y, r * 0.22, accent);
    g.strokeStyle = withAlpha(accent, 0.85);
    g.lineWidth = 1.7;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.ellipse(x, y, r, r * 0.36, i * Math.PI / 3, 0, TAU);
      g.stroke();
    }
    g.fillStyle = withAlpha(color, 0.35);
    g.beginPath();
    g.arc(x + r * 0.72, y - r * 0.18, r * 0.12, 0, TAU);
    g.fill();
    g.restore();
  }

  function drawGear(g, x, y, r, color) {
    g.save();
    g.fillStyle = color;
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU;
      const rr = i % 2 ? r * 0.78 : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(35,28,23,.75)";
    g.beginPath();
    g.arc(x, y, r * 0.38, 0, TAU);
    g.fill();
    g.restore();
  }

  function drawPipe(g, x, y, len, body, accent) {
    g.save();
    g.strokeStyle = body;
    g.lineWidth = 5;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + len * 0.45, y - 14, x + len, y);
    g.stroke();
    g.strokeStyle = withAlpha(accent, 0.55);
    g.lineWidth = 1.2;
    g.stroke();
    g.restore();
  }

  function drawMetalBlock(g, x, y, w, h, body, color, accent) {
    const grad = g.createLinearGradient(x - w / 2, y - h, x + w / 2, y + h / 2);
    grad.addColorStop(0, lighten(body, 0.2));
    grad.addColorStop(1, darken(body, 0.18));
    g.fillStyle = grad;
    roundRect(g, x - w / 2, y - h / 2, w, h, 5);
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    drawWindow(g, x - w * 0.25, y - h * 0.05, Math.max(3, h * 0.16), color);
    drawWindow(g, x + w * 0.25, y - h * 0.05, Math.max(3, h * 0.16), color);
  }

  function drawEnergyTower(g, x, y, h, color, accent) {
    g.save();
    g.strokeStyle = "#3c4447";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x - h * 0.23, y + h * 0.35);
    g.lineTo(x, y - h * 0.45);
    g.lineTo(x + h * 0.23, y + h * 0.35);
    g.moveTo(x - h * 0.16, y - h * 0.06);
    g.lineTo(x + h * 0.16, y - h * 0.06);
    g.stroke();
    drawBolt(g, x, y - h * 0.22, h * 0.22, accent);
    drawGoldDot(g, x, y - h * 0.48, h * 0.07, color);
    g.restore();
  }

  function drawBolt(g, x, y, size, color) {
    g.save();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x + size * 0.05, y - size * 0.55);
    g.lineTo(x - size * 0.26, y + size * 0.05);
    g.lineTo(x + size * 0.04, y + size * 0.05);
    g.lineTo(x - size * 0.08, y + size * 0.55);
    g.lineTo(x + size * 0.34, y - size * 0.12);
    g.lineTo(x + size * 0.06, y - size * 0.12);
    g.closePath();
    g.fill();
    g.restore();
  }

  function drawCannon(g, x, y, len, body, accent) {
    g.save();
    g.translate(x, y);
    g.rotate(-0.22);
    g.strokeStyle = body;
    g.lineWidth = Math.max(5, len * 0.18);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(-len * 0.25, 0);
    g.lineTo(len * 0.55, -len * 0.08);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 1.5;
    g.stroke();
    g.restore();
  }

  function drawOrganicMound(g, x, y, w, h, body, color, accent) {
    g.save();
    const grad = g.createRadialGradient(x - w * 0.15, y - h * 0.3, 2, x, y, w * 0.65);
    grad.addColorStop(0, lighten(body, 0.18));
    grad.addColorStop(1, darken(body, 0.15));
    g.fillStyle = grad;
    ellipse(g, x, y, w * 0.5, h * 0.55);
    g.fill();
    g.strokeStyle = withAlpha(accent, 0.7);
    g.stroke();
    g.fillStyle = withAlpha(color, 0.52);
    ellipse(g, x, y - h * 0.24, w * 0.25, h * 0.18);
    g.fill();
    g.restore();
  }

  function drawSpikes(g, x, y, w, color) {
    g.save();
    g.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      const px = x - w * 0.4 + i * w * 0.2;
      g.beginPath();
      g.moveTo(px, y + w * 0.16);
      g.lineTo(px + w * 0.05, y - w * (0.18 + (i % 2) * 0.12));
      g.lineTo(px + w * 0.12, y + w * 0.16);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  function drawClaws(g, x, y, w, color) {
    g.save();
    g.strokeStyle = color;
    g.lineWidth = 4;
    g.lineCap = "round";
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(x + i * w * 0.16, y + w * 0.26);
      g.quadraticCurveTo(x + i * w * 0.1, y - w * 0.2, x + i * w * 0.28, y - w * 0.38);
      g.stroke();
    }
    g.restore();
  }

  function drawBoneSpire(g, x, y, h, bone, accent) {
    g.save();
    g.strokeStyle = bone;
    g.lineWidth = 6;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, y + h * 0.48);
    g.lineTo(x, y - h * 0.42);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 2;
    g.stroke();
    drawSpikes(g, x, y - h * 0.1, h * 0.65, bone);
    g.restore();
  }

  function drawBubbleDots(g, x, y, w, color) {
    for (let i = 0; i < 6; i++) drawGoldDot(g, x - w * 0.4 + i * w * 0.16, y + Math.sin(i) * 4, 2.4, color);
  }

  function drawCrystalCluster(g, x, y, size, color, accent, element) {
    g.save();
    const count = element === "fusion" ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const px = x + (i - (count - 1) / 2) * size * 0.23;
      const h = size * (0.56 + (i % 2) * 0.24);
      const grad = g.createLinearGradient(px, y - h, px, y + h * 0.2);
      grad.addColorStop(0, lighten(color, 0.28));
      grad.addColorStop(1, darken(color, 0.12));
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(px, y - h);
      g.lineTo(px + size * 0.17, y - h * 0.15);
      g.lineTo(px + size * 0.08, y + h * 0.22);
      g.lineTo(px - size * 0.12, y + h * 0.18);
      g.lineTo(px - size * 0.18, y - h * 0.16);
      g.closePath();
      g.fill();
      g.strokeStyle = withAlpha(accent, 0.72);
      g.stroke();
    }
    g.restore();
  }

  function drawTreeTower(g, x, y, h, color, accent) {
    g.save();
    g.strokeStyle = "#5b3b24";
    g.lineWidth = 9;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, y + h * 0.35);
    g.quadraticCurveTo(x - h * 0.1, y, x, y - h * 0.38);
    g.stroke();
    drawLeaves(g, x, y - h * 0.34, h * 0.48, color);
    drawLeaves(g, x - h * 0.18, y - h * 0.18, h * 0.34, color);
    drawLeaves(g, x + h * 0.18, y - h * 0.18, h * 0.34, color);
    drawGoldDot(g, x, y - h * 0.34, h * 0.06, accent);
    g.restore();
  }

  function drawLeaves(g, x, y, r, color) {
    g.save();
    g.fillStyle = color;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      ellipse(g, x + Math.cos(a) * r * 0.28, y + Math.sin(a) * r * 0.16, r * 0.26, r * 0.14);
      g.fill();
    }
    g.restore();
  }

  function drawBladeGlyph(g, x, y, len, color) {
    g.save();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x, y - len * 0.5);
    g.lineTo(x + len * 0.18, y + len * 0.18);
    g.lineTo(x, y + len * 0.5);
    g.lineTo(x - len * 0.18, y + len * 0.18);
    g.closePath();
    g.fill();
    g.restore();
  }

  function drawBattlement(g, x, y, w, h, body, accent) {
    g.save();
    g.fillStyle = body;
    roundRect(g, x - w / 2, y - h / 2, w, h, 2);
    g.fill();
    g.fillStyle = lighten(body, 0.16);
    g.fillRect(x - w / 2, y - h / 2, w, h * 0.18);
    g.strokeStyle = accent;
    g.stroke();
    g.restore();
  }

  function drawFlame(g, x, y, r, outer, inner) {
    g.save();
    g.fillStyle = outer;
    g.beginPath();
    g.moveTo(x, y - r);
    g.quadraticCurveTo(x + r, y, x, y + r);
    g.quadraticCurveTo(x - r, y, x, y - r);
    g.fill();
    g.fillStyle = inner;
    g.beginPath();
    g.moveTo(x, y - r * 0.5);
    g.quadraticCurveTo(x + r * 0.45, y, x, y + r * 0.55);
    g.quadraticCurveTo(x - r * 0.45, y, x, y - r * 0.5);
    g.fill();
    g.restore();
  }

  function drawFirePot(g, x, y, r, outer, inner) {
    drawGoldDot(g, x, y + r * 0.35, r * 0.55, "#6b4930");
    drawFlame(g, x, y - r * 0.25, r, outer, inner);
  }

  function drawTrackedVehicle(g, x, y, w, h, body, color, accent) {
    g.save();
    g.fillStyle = "#283033";
    roundRect(g, x - w / 2, y - h * 0.12, w, h * 0.42, h * 0.18);
    g.fill();
    g.fillStyle = body;
    roundRect(g, x - w * 0.36, y - h * 0.65, w * 0.72, h * 0.68, 5);
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    drawWindow(g, x - w * 0.08, y - h * 0.35, h * 0.14, color);
    g.restore();
  }

  function drawRobotTorso(g, x, y, size, color, accent) {
    g.save();
    g.fillStyle = "#4d5a5f";
    roundRect(g, x - size * 0.42, y - size * 0.42, size * 0.84, size * 0.84, 4);
    g.fill();
    g.strokeStyle = accent;
    g.stroke();
    drawWindow(g, x, y, size * 0.16, color);
    g.restore();
  }

  function drawMechSuit(g, x, y, size, color, accent) {
    g.save();
    drawRobotTorso(g, x, y - size * 0.18, size * 0.64, color, accent);
    g.strokeStyle = "#3a4549";
    g.lineWidth = size * 0.1;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x - size * 0.28, y - size * 0.05);
    g.lineTo(x - size * 0.52, y + size * 0.22);
    g.moveTo(x + size * 0.28, y - size * 0.05);
    g.lineTo(x + size * 0.52, y + size * 0.22);
    g.moveTo(x - size * 0.16, y + size * 0.18);
    g.lineTo(x - size * 0.24, y + size * 0.48);
    g.moveTo(x + size * 0.16, y + size * 0.18);
    g.lineTo(x + size * 0.24, y + size * 0.48);
    g.stroke();
    drawCannon(g, x + size * 0.28, y - size * 0.22, size * 0.7, "#2f3b40", accent);
    g.restore();
  }

  function drawMechQuadruped(g, x, y, size, color, accent) {
    g.save();
    g.fillStyle = "#4d5a5f";
    ellipse(g, x, y, size * 0.38, size * 0.18);
    g.fill();
    g.fillStyle = color;
    ellipse(g, x + size * 0.34, y - size * 0.1, size * 0.16, size * 0.13);
    g.fill();
    g.strokeStyle = "#2f393c";
    g.lineWidth = 3;
    for (const px of [-0.28, -0.08, 0.14, 0.3]) {
      g.beginPath();
      g.moveTo(x + px * size, y + size * 0.12);
      g.lineTo(x + (px + 0.04) * size, y + size * 0.36);
      g.stroke();
    }
    drawBolt(g, x, y - size * 0.2, size * 0.18, accent);
    g.restore();
  }

  function drawBug(g, x, y, size, body, accent) {
    g.save();
    const grad = g.createRadialGradient(x - size * 0.1, y - size * 0.16, 2, x, y, size * 0.55);
    grad.addColorStop(0, lighten(body, 0.2));
    grad.addColorStop(1, darken(body, 0.18));
    g.fillStyle = grad;
    ellipse(g, x, y, size * 0.44, size * 0.27);
    g.fill();
    ellipse(g, x + size * 0.36, y - size * 0.08, size * 0.18, size * 0.16);
    g.fill();
    g.strokeStyle = darken(body, 0.32);
    g.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      if (!i) continue;
      g.beginPath();
      g.moveTo(x + i * size * 0.1, y + size * 0.12);
      g.lineTo(x + i * size * 0.2, y + size * 0.38);
      g.stroke();
    }
    g.strokeStyle = accent;
    g.stroke();
    g.restore();
  }

  function drawTiger(g, x, y, size, body, accent) {
    g.save();
    g.fillStyle = body;
    ellipse(g, x, y, size * 0.42, size * 0.22);
    g.fill();
    ellipse(g, x + size * 0.38, y - size * 0.14, size * 0.17, size * 0.16);
    g.fill();
    g.strokeStyle = darken(body, 0.38);
    g.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(x - size * 0.16 + i * size * 0.14, y - size * 0.16);
      g.lineTo(x - size * 0.08 + i * size * 0.14, y + size * 0.1);
      g.stroke();
    }
    drawClaws(g, x + size * 0.24, y + size * 0.08, size * 0.28, accent);
    g.restore();
  }

  function drawWolf(g, x, y, size, body, accent) {
    drawTiger(g, x, y, size, body, accent);
    drawElementAura(g, x - size * 0.08, y - size * 0.05, size * 0.38, "#6c7a92");
  }

  function drawLargeBeast(g, x, y, size, body, accent, tusks) {
    g.save();
    g.fillStyle = darken(body, 0.05);
    ellipse(g, x, y, size * 0.5, size * 0.3);
    g.fill();
    g.fillStyle = body;
    ellipse(g, x + size * 0.36, y - size * 0.08, size * 0.23, size * 0.2);
    g.fill();
    if (tusks) {
      g.strokeStyle = "#e7d7b7";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x + size * 0.45, y);
      g.quadraticCurveTo(x + size * 0.75, y + size * 0.08, x + size * 0.62, y + size * 0.28);
      g.stroke();
    }
    drawSpikes(g, x - size * 0.1, y - size * 0.28, size * 0.58, accent);
    g.restore();
  }

  function drawElementAura(g, x, y, r, color) {
    g.save();
    const grad = g.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, withAlpha(color, 0.38));
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.restore();
  }

  function drawSpiritBody(g, x, y, size, color, accent, element) {
    g.save();
    drawCrystalCluster(g, x, y + size * 0.08, size * 0.72, color, accent, element);
    drawGoldDot(g, x, y - size * 0.52, size * 0.16, lighten(color, 0.2));
    if (element === "fire") drawFlame(g, x, y - size * 0.12, size * 0.3, color, "#ffd36e");
    if (element === "wood") drawLeaves(g, x, y - size * 0.1, size * 0.5, color);
    if (element === "water") drawWaveLines(g, x, y + size * 0.28, size * 0.9, color);
    g.restore();
  }

  function drawCrystalGolem(g, x, y, size, color, accent, element) {
    g.save();
    drawCrystalCluster(g, x, y - size * 0.15, size, color, accent, element);
    g.strokeStyle = darken(color, 0.25);
    g.lineWidth = 5;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x - size * 0.25, y + size * 0.1);
    g.lineTo(x - size * 0.42, y + size * 0.36);
    g.moveTo(x + size * 0.25, y + size * 0.1);
    g.lineTo(x + size * 0.42, y + size * 0.36);
    g.stroke();
    if (element === "earth") drawRock(g, x, y + size * 0.28, size * 0.22, color);
    g.restore();
  }

  function drawCatapultArm(g, x, y, len, accent) {
    g.save();
    g.strokeStyle = "#68442a";
    g.lineWidth = 4;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x - len * 0.28, y + len * 0.22);
    g.lineTo(x + len * 0.24, y - len * 0.36);
    g.stroke();
    drawRock(g, x + len * 0.3, y - len * 0.42, len * 0.12, accent);
    g.restore();
  }

  function drawLadder(g, x, y, len, accent) {
    g.save();
    g.strokeStyle = "#6c4327";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x - len * 0.16, y + len * 0.45);
    g.lineTo(x - len * 0.02, y - len * 0.45);
    g.moveTo(x + len * 0.16, y + len * 0.45);
    g.lineTo(x + len * 0.3, y - len * 0.45);
    for (let i = 0; i < 5; i++) {
      const yy = y + len * (0.32 - i * 0.17);
      g.moveTo(x - len * 0.13 + i * len * 0.03, yy);
      g.lineTo(x + len * 0.2 + i * len * 0.03, yy);
    }
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 1;
    g.stroke();
    g.restore();
  }

  function drawBallista(g, x, y, len, accent) {
    drawCrossbowTop(g, x, y, len * 0.72, accent);
    drawSpear(g, x + len * 0.18, y + len * 0.04, len * 0.78, accent);
  }

  function drawRamHead(g, x, y, len, accent) {
    g.save();
    g.strokeStyle = "#57371f";
    g.lineWidth = 5;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x - len * 0.45, y);
    g.lineTo(x + len * 0.35, y);
    g.stroke();
    drawHorn(g, x + len * 0.42, y, len * 0.22, accent);
    g.restore();
  }

  function drawRocketRack(g, x, y, w, accent) {
    g.save();
    g.strokeStyle = "#3e4649";
    g.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(x - w * 0.35, y + i * 5);
      g.lineTo(x + w * 0.35, y + i * 1);
      g.stroke();
      drawFlame(g, x + w * 0.38, y + i * 1, 3, "#ef6f38", "#ffd36e");
    }
    g.strokeStyle = accent;
    g.lineWidth = 1;
    g.strokeRect(x - w * 0.38, y - 9, w * 0.36, 18);
    g.restore();
  }

  function drawDragonProw(g, x, y, size, accent) {
    g.save();
    g.fillStyle = accent;
    g.beginPath();
    g.moveTo(x, y - size * 0.45);
    g.quadraticCurveTo(x + size * 0.45, y - size * 0.08, x, y + size * 0.36);
    g.quadraticCurveTo(x - size * 0.16, y, x, y - size * 0.45);
    g.fill();
    drawHorn(g, x + size * 0.1, y - size * 0.34, size * 0.18, "#fff0bd");
    g.restore();
  }

  function lighten(color, amount) {
    return mixColor(color, "#ffffff", amount);
  }

  function darken(color, amount) {
    return mixColor(color, "#000000", amount);
  }

  function mixColor(a, b, t) {
    const ca = parseHexColor(a);
    const cb = parseHexColor(b);
    if (!ca || !cb) return a;
    const r = Math.round(ca.r + (cb.r - ca.r) * t);
    const g = Math.round(ca.g + (cb.g - ca.g) * t);
    const bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function parseHexColor(color) {
    if (!color || !String(color).startsWith("#")) return null;
    let hex = String(color).slice(1);
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length !== 6) return null;
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }

  function drawAbilityAsset(g, id, w, h, color, accent) {
    g.translate(w / 2, h / 2);
    const c = id.includes("fire") || id.includes("beast") ? "#cf5b3a" : id.includes("arrow") || id.includes("formation") ? "#d9a348" : id.includes("overload") ? "#67b7ff" : color;
    g.fillStyle = "rgba(0,0,0,.18)";
    ellipse(g, 0, 18, w * 0.26, 6);
    g.fill();
    g.fillStyle = c;
    g.strokeStyle = accent;
    g.lineWidth = 3;
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + i / 8 * TAU;
      const r = i % 2 ? 16 : 27;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = "#fff0bd";
    g.font = "900 22px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(iconForAbility(id), 0, 1);
  }

  function iconForAbility(id) {
    if (id.includes("build")) return "建";
    if (id.includes("attack")) return "攻";
    if (id.includes("arrow")) return "箭";
    if (id.includes("formation")) return "阵";
    if (id.includes("overload")) return "电";
    if (id.includes("fusion")) return "融";
    if (id.includes("weather")) return "象";
    if (id.includes("beast")) return "兽";
    if (id.includes("save")) return "存";
    if (id.includes("load")) return "读";
    if (id.includes("stop")) return "停";
    return "令";
  }

  function elementColor(element) {
    return { water: "#58b9de", fire: "#df673d", earth: "#b79255", metal: "#d5dde3", wood: "#58ad62" }[element] || "#aaa";
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r);
    g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }

  function ellipse(g, x, y, rx, ry) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, TAU);
  }

  function renderWorld() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.save();
    ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
    ctx.scale(state.camera.zoom, state.camera.zoom);
    ctx.translate(-state.camera.x, -state.camera.y);
    drawTerrain();
    drawDecals();
    drawResources();
    drawEntities();
    drawProjectiles();
    drawSelectionWorld();
    drawBuildPreview();
    drawFloatersAndBubbles();
    ctx.restore();
    drawScreenSelection();
    if (state.needsMini) drawMinimap();
  }

  function visibleBounds(pad = 120) {
    const w = window.innerWidth / state.camera.zoom;
    const h = window.innerHeight / state.camera.zoom;
    return {
      left: state.camera.x - w / 2 - pad,
      right: state.camera.x + w / 2 + pad,
      top: state.camera.y - h / 2 - pad,
      bottom: state.camera.y + h / 2 + pad
    };
  }

  function drawTerrain() {
    const b = visibleBounds();
    const startX = clamp(Math.floor(b.left / TILE), 0, state.terrain[0].length - 1);
    const endX = clamp(Math.ceil(b.right / TILE), 0, state.terrain[0].length - 1);
    const startY = clamp(Math.floor(b.top / TILE), 0, state.terrain.length - 1);
    const endY = clamp(Math.ceil(b.bottom / TILE), 0, state.terrain.length - 1);
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const t = state.terrain[y][x];
        const d = TERRAIN[t] || TERRAIN.grass;
        ctx.fillStyle = d.color;
        ctx.fillRect(x * TILE, y * TILE, TILE + 1, TILE + 1);
        const n = noise(x * 2.1, y * 1.7);
        ctx.fillStyle = n > 0.5 ? d.detail : "rgba(255,255,255,.03)";
        ctx.globalAlpha = 0.14;
        ctx.beginPath();
        ctx.arc(x * TILE + (n * 71) % TILE, y * TILE + (n * 43) % TILE, 14 + n * 18, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    drawGridOverlay(startX, endX, startY, endY);
  }

  function drawGridOverlay(startX, endX, startY, endY) {
    ctx.strokeStyle = "rgba(0,0,0,.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x <= endX + 1; x++) {
      ctx.moveTo(x * TILE, startY * TILE);
      ctx.lineTo(x * TILE, (endY + 1) * TILE);
    }
    for (let y = startY; y <= endY + 1; y++) {
      ctx.moveTo(startX * TILE, y * TILE);
      ctx.lineTo((endX + 1) * TILE, y * TILE);
    }
    ctx.stroke();
  }

  function drawDecals() {
    for (const d of state.decals) {
      const alpha = clamp(d.ttl / d.max, 0, 1);
      if (d.kind === "fire") {
        ctx.fillStyle = `rgba(212,82,38,${0.22 * alpha})`;
      } else if (d.kind === "mud") {
        ctx.fillStyle = `rgba(93,71,45,${0.32 * alpha})`;
      } else if (d.kind === "target") {
        ctx.strokeStyle = `rgba(213,70,55,${0.9 * alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, TAU);
        ctx.stroke();
        continue;
      } else if (d.kind === "gather") {
        ctx.strokeStyle = `rgba(112,216,105,${0.9 * alpha})`;
        ctx.fillStyle = `rgba(112,216,105,${0.12 * alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r + (1 - alpha) * 14, 0, TAU);
        ctx.fill();
        ctx.stroke();
        continue;
      } else if (d.kind === "spawn" || d.kind === "complete" || d.kind === "upgrade" || d.kind === "build") {
        const tone = d.kind === "upgrade" || d.kind === "build" ? [255, 213, 120] : d.kind === "complete" ? [125, 223, 122] : [103, 169, 255];
        const pulse = d.r + (1 - alpha) * (d.kind === "upgrade" ? 46 : 24);
        ctx.strokeStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},${0.9 * alpha})`;
        ctx.fillStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},${0.13 * alpha})`;
        ctx.lineWidth = d.kind === "upgrade" ? 4 : 3;
        ctx.beginPath();
        ctx.arc(d.x, d.y, pulse, 0, TAU);
        ctx.fill();
        ctx.stroke();
        continue;
      } else if (d.kind === "hit") {
        ctx.strokeStyle = `rgba(255,235,190,${0.75 * alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r + (1 - alpha) * 12, 0, TAU);
        ctx.stroke();
        continue;
      } else if (d.kind === "marker") {
        ctx.strokeStyle = `rgba(91,157,240,${0.9 * alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, TAU);
        ctx.stroke();
        continue;
      } else if (d.kind === "wreck" || d.kind === "ruin") {
        ctx.fillStyle = `rgba(40,34,29,${0.4 * alpha})`;
      } else {
        ctx.fillStyle = `rgba(255,205,90,${0.18 * alpha})`;
      }
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawResources() {
    for (const n of state.resourcesNodes) {
      if (n.amount <= 0) continue;
      const pct = n.amount / n.max;
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.fillStyle = n.type === "wood" ? "#24472b" : RES[n.type].color;
      ctx.strokeStyle = "rgba(0,0,0,.28)";
      ctx.lineWidth = 2;
      if (n.type === "wood") {
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.arc(Math.cos(i) * n.r * 0.45, Math.sin(i * 1.6) * n.r * 0.35, 14 + 8 * pct, 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
      } else {
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const a = i / 5 * TAU;
          ctx.rect(Math.cos(a) * n.r * 0.35 - 10, Math.sin(a) * n.r * 0.25 - 8, 20, 16);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawEntities() {
    const all = [...state.buildings, ...state.units].filter((e) => !e.dead);
    all.sort((a, b) => (a.y + a.r) - (b.y + b.r));
    for (const e of all) {
      if (e.kind === "building") drawBuilding(e);
      else drawUnit(e);
    }
  }

  function drawBuilding(b) {
    const def = BUILDINGS[b.type];
    const faction = def.faction === "all" ? (b.owner === "player" ? state.faction : "huaxia") : def.faction;
    const color = b.owner === "enemy" ? "#a84436" : FACTIONS[faction]?.color || "#5b75a4";
    const accent = FACTIONS[faction]?.accent || "#d9a348";
    const profile = buildingArtProfile(b.type);
    const s = clamp(b.r / 42, 0.72, 1.72);
    ctx.save();
    ctx.translate(b.x, b.y);
    drawSoftGround(ctx, 0, b.r * 0.76, b.r * 1.16, b.r * 0.34);
    if (!b.built || b.fx?.buildPulse > 0) {
      const a = !b.built ? 0.42 + Math.sin(state.time * 5 + b.id) * 0.16 : clamp(b.fx.buildPulse / 0.8, 0, 1);
      ctx.strokeStyle = `rgba(255,213,120,${a})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, b.r * 0.1, b.r + 14 + Math.sin(state.time * 4) * 3, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (b.fx?.complete > 0 || b.fx?.upgrade > 0) {
      const ttl = b.fx.upgrade > 0 ? b.fx.upgrade : b.fx.complete;
      const max = b.fx.upgrade > 0 ? 1.2 : 0.75;
      const a = clamp(ttl / max, 0, 1);
      const colorRing = b.fx.upgrade > 0 ? [255, 213, 120] : [125, 223, 122];
      ctx.strokeStyle = `rgba(${colorRing[0]},${colorRing[1]},${colorRing[2]},${0.85 * a})`;
      ctx.fillStyle = `rgba(${colorRing[0]},${colorRing[1]},${colorRing[2]},${0.1 * a})`;
      ctx.lineWidth = b.fx.upgrade > 0 ? 4 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + (b.fx.upgrade > 0 ? 40 : 24) * (1 - a), 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.save();
    if (!b.built) ctx.globalAlpha = 0.58;
    drawIsoPad(ctx, 0, b.r * 0.45, b.r * 1.44, b.r * 0.42, "#947354", "#4f3524", accent);
    if (profile === "palace") drawPalaceIcon(ctx, s, color, accent);
    else if (profile === "house") drawHouseIcon(ctx, s, color, accent);
    else if (profile === "wood") drawResourceIcon(ctx, s, color, accent, "wood");
    else if (profile === "stone") drawResourceIcon(ctx, s, color, accent, "stone");
    else if (profile === "gold") drawResourceIcon(ctx, s, color, accent, "gold");
    else if (profile === "metal") drawResourceIcon(ctx, s, color, accent, "metal");
    else if (profile === "military") drawMilitaryIcon(ctx, s, color, accent, b.type);
    else if (profile === "tech") drawTechIcon(ctx, s, color, accent, b.type);
    else if (profile === "defense") drawDefenseIcon(ctx, s, color, accent, b.type);
    else if (profile === "mech") drawMechBuildingIcon(ctx, s, color, accent, b.type);
    else if (profile === "beast") drawBeastBuildingIcon(ctx, s, color, accent, b.type);
    else if (profile === "nature") drawNatureBuildingIcon(ctx, s, color, accent, b.type);
    else if (profile === "hybrid") drawHybridBuildingIcon(ctx, s, color, accent, b.type);
    else drawHouseIcon(ctx, s, color, accent);
    ctx.restore();
    if (!b.built) {
      ctx.strokeStyle = "rgba(255,213,120,.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      roundRect(ctx, -b.r * 0.92, -b.r * 0.9, b.r * 1.84, b.r * 1.7, 5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (state.faction === "jixie" && b.owner === "player" && def.faction === "jixie") {
      ctx.strokeStyle = b.powered ? "rgba(107,193,255,.68)" : "rgba(210,64,54,.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 10 + Math.sin(state.time * 4) * 2, 0, TAU);
      ctx.stroke();
    }
    if (b.overloaded > 0) {
      ctx.strokeStyle = "rgba(133,97,255,.85)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 15, 0, TAU);
      ctx.stroke();
    }
    if (b.fx?.hitFlash > 0) {
      const a = clamp(b.fx.hitFlash / 0.22, 0, 1);
      ctx.fillStyle = `rgba(255,238,200,${0.18 * a})`;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 12, 0, TAU);
      ctx.fill();
    }
    drawEntityHud(b, def.name);
    ctx.restore();
  }

  function drawUnit(u) {
    const def = UNITS[u.type];
    const faction = def.faction === "all" ? (u.owner === "player" ? state.faction : "huaxia") : def.faction;
    const color = u.owner === "enemy" ? "#b8483d" : FACTIONS[faction]?.color || "#547ac5";
    const accent = FACTIONS[faction]?.accent || "#d9a348";
    ctx.save();
    ctx.translate(u.x, u.y);
    if (def.tags?.includes("flying")) ctx.translate(0, Math.sin(state.time * 5 + u.id) * 4 - 18);
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ellipse(ctx, 0, u.r * 0.78 + (def.tags?.includes("flying") ? 18 : 0), u.r * 1.2, u.r * 0.45);
    ctx.fill();
    if (u.fx?.spawn > 0) {
      const a = clamp(u.fx.spawn / 0.75, 0, 1);
      ctx.strokeStyle = `rgba(103,169,255,${0.9 * a})`;
      ctx.fillStyle = `rgba(103,169,255,${0.12 * a})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, u.r + 22 * (1 - a), 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    if (u.fx?.order > 0) {
      const a = clamp(u.fx.order / 0.55, 0, 1);
      ctx.strokeStyle = `rgba(255,214,110,${0.75 * a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, u.r + 12 + Math.sin(state.time * 16 + u.id) * 2, 0, TAU);
      ctx.stroke();
    }
    if (u.order === "gather" && u.gatherTarget) {
      const pulse = 0.5 + Math.sin(state.time * 8 + u.id) * 0.5;
      ctx.strokeStyle = `rgba(112,216,105,${0.38 + pulse * 0.24})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, u.r + 9 + pulse * 4, 0, TAU);
      ctx.stroke();
    }
    if (state.selected.includes(u.id)) {
      ctx.strokeStyle = "#ffd66e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, u.r + 8, 0, TAU);
      ctx.stroke();
    }
    if (def.tags?.includes("ship")) drawWorldShip(u, color, accent);
    else if (def.tags?.includes("mechanical") || def.tags?.includes("vehicle")) drawWorldMech(u, color, accent);
    else if (def.tags?.includes("beast")) drawWorldBeast(u, color, accent);
    else if (def.tags?.includes("flying")) drawWorldFlying(u, color, accent);
    else if (def.tags?.includes("element")) drawWorldElement(u, color, accent);
    else drawWorldSoldier(u, color, accent);
    if (u.fx?.hitFlash > 0) {
      const a = clamp(u.fx.hitFlash / 0.22, 0, 1);
      ctx.fillStyle = `rgba(255,238,200,${0.28 * a})`;
      ctx.beginPath();
      ctx.arc(0, 0, u.r + 6, 0, TAU);
      ctx.fill();
    }
    if (u.star > 1) {
      ctx.fillStyle = "#ffd578";
      ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★".repeat(Math.min(5, u.star)), 0, -u.r - 16);
    }
    drawEntityHud(u, def.name);
    ctx.restore();
  }

  function drawWorldSoldier(u, color, accent) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -u.r * 0.65, u.r * 0.45, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#3e2c22";
    roundRect(ctx, -u.r * 0.42, -u.r * 0.25, u.r * 0.84, u.r * 1.1, 3);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (UNITS[u.type].tags?.includes("archer") || UNITS[u.type].tags?.includes("ranged")) {
      ctx.arc(u.r * 0.2, 0, u.r * 0.9, -Math.PI / 2, Math.PI / 2);
    } else {
      ctx.moveTo(-u.r * 0.8, u.r * 0.6);
      ctx.lineTo(u.r * 0.8, -u.r * 0.7);
    }
    ctx.stroke();
  }

  function drawWorldMech(u, color, accent) {
    ctx.fillStyle = "#3f4749";
    roundRect(ctx, -u.r * 1.1, -u.r * 0.45, u.r * 2.2, u.r * 1.25, 4);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, -u.r * 0.7, -u.r * 1.1, u.r * 1.4, u.r * 0.8, 4);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(u.r * 0.2, -u.r * 0.75);
    ctx.lineTo(u.r * 1.4, -u.r * 0.95);
    ctx.stroke();
    if (u.status.some((s) => s.kind === "overload")) {
      ctx.strokeStyle = "#77c7ff";
      ctx.beginPath();
      ctx.arc(0, 0, u.r + 7, 0, TAU);
      ctx.stroke();
    }
  }

  function drawWorldBeast(u, color, accent) {
    ctx.fillStyle = color;
    ellipse(ctx, 0, 0, u.r * 1.12, u.r * 0.62);
    ctx.fill();
    ctx.fillStyle = accent;
    ellipse(ctx, u.r * 0.7, -u.r * 0.35, u.r * 0.44, u.r * 0.34);
    ctx.fill();
    ctx.strokeStyle = "#2d1c14";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-u.r * 0.75, -u.r * 0.1);
    ctx.lineTo(-u.r * 1.25, -u.r * 0.42);
    ctx.stroke();
  }

  function drawWorldFlying(u, color, accent) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -u.r * 1.2);
    ctx.lineTo(u.r * 0.35, u.r * 0.1);
    ctx.lineTo(u.r * 1.4, u.r * 0.35);
    ctx.lineTo(u.r * 0.1, u.r * 0.55);
    ctx.lineTo(0, u.r);
    ctx.lineTo(-u.r * 0.1, u.r * 0.55);
    ctx.lineTo(-u.r * 1.4, u.r * 0.35);
    ctx.lineTo(-u.r * 0.35, u.r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawWorldShip(u, color, accent) {
    ctx.fillStyle = "#5a3f2e";
    ctx.beginPath();
    ctx.moveTo(-u.r * 1.4, u.r * 0.2);
    ctx.lineTo(u.r * 1.4, u.r * 0.2);
    ctx.lineTo(u.r * 0.9, u.r * 1);
    ctx.lineTo(-u.r * 0.9, u.r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, -u.r * 0.6, -u.r * 0.9, u.r * 1.2, u.r * 1, 3);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.stroke();
  }

  function drawWorldElement(u, color, accent) {
    const e = UNITS[u.type].element;
    ctx.fillStyle = elementColor(e);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      const r = i % 2 ? u.r * 0.68 : u.r * 1.12;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (terrainElement(getTerrainAt(u.x, u.y)) === e) {
      ctx.strokeStyle = elementColor(e);
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, u.r + 9 + Math.sin(state.time * 4) * 2, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawEntityHud(e, name) {
    if (!state.showHpBars) return;
    const hpPct = e.maxHp ? e.hp / e.maxHp : 1;
    if (e.owner === "player" || state.selected.includes(e.id) || hpPct < 1) {
      const w = e.kind === "building" ? e.r * 1.5 : e.r * 2.2;
      const y = -e.r - 18;
      ctx.fillStyle = "rgba(0,0,0,.52)";
      roundRect(ctx, -w / 2, y, w, 6, 2);
      ctx.fill();
      ctx.fillStyle = e.owner === "enemy" ? "#c74f42" : "#5dbb71";
      roundRect(ctx, -w / 2, y, w * clamp(hpPct, 0, 1), 6, 2);
      ctx.fill();
      if (state.showSelectionNames && state.selected.includes(e.id)) {
        ctx.fillStyle = "#fff0bd";
        ctx.font = "700 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(name, 0, y - 4);
      }
    }
  }

  function drawProjectiles() {
    for (const beam of state.beams) {
      const a = clamp(beam.ttl / beam.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = withAlpha(beam.color, Math.min(1, a * 0.9));
      ctx.lineWidth = beam.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
      ctx.restore();
    }
    for (const p of state.projectiles) {
      ctx.fillStyle = colorForDamage(p.damageType);
      ctx.strokeStyle = "rgba(0,0,0,.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.damageType === "siege" ? 6 : 3.5, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    for (const p of state.particles) {
      const a = clamp(p.ttl / p.max, 0, 1);
      ctx.fillStyle = withAlpha(p.color, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, TAU);
      ctx.fill();
    }
  }

  function withAlpha(color, alpha) {
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
  }

  function drawSelectionWorld() {
    for (const id of state.selected) {
      const e = objectById(id);
      if (!e) continue;
      ctx.strokeStyle = "#ffd66e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 10, 0, TAU);
      ctx.stroke();
    }
  }

  function drawBuildPreview() {
    if (!state.buildMode) return;
    const def = BUILDINGS[state.buildMode];
    const x = state.mouse.worldX;
    const y = state.mouse.worldY;
    const c = canPlace(state.buildMode, x, y);
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = c.ok ? "rgba(95,180,110,.32)" : "rgba(210,70,55,.32)";
    ctx.strokeStyle = c.ok ? "#77d586" : "#e05a4d";
    ctx.lineWidth = 3;
    const r = (def.footprint || 2) * 24;
    roundRect(ctx, x - r, y - r, r * 2, r * 2, 5);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff0bd";
    ctx.font = "700 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(c.ok ? def.name : c.reason, x, y - r - 10);
    ctx.restore();
  }

  function drawFloatersAndBubbles() {
    if (state.showDamageText) {
      for (const f of state.floaters) {
        const a = clamp(f.ttl / f.max, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = floaterColor(f.type);
        ctx.strokeStyle = "rgba(0,0,0,.5)";
        ctx.lineWidth = 3;
        ctx.font = `${f.type === "crit" ? "900 24px" : "900 18px"} sans-serif`;
        ctx.textAlign = "center";
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }
    }
    for (const b of state.bubbles) {
      const a = clamp(b.ttl / b.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 1.4);
      ctx.font = `${b.type === "ultimate" ? "900 22px" : "900 16px"} sans-serif`;
      const width = ctx.measureText(b.text).width + 28;
      const height = b.type === "ultimate" ? 34 : 28;
      ctx.fillStyle = bubbleColor(b.type);
      ctx.strokeStyle = "rgba(255,226,159,.7)";
      roundRect(ctx, b.x - width / 2, b.y - height, width, height, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff2c7";
      ctx.textAlign = "center";
      ctx.fillText(b.text, b.x, b.y - (b.type === "ultimate" ? 11 : 9));
      ctx.restore();
    }
  }

  function floaterColor(type) {
    return {
      heal: "#79df7a",
      repair: "#8bd1ff",
      crit: "#ff5e4f",
      counter: "#ffd66e",
      fire: "#ff8a42",
      poison: "#98dd5a",
      pierce: "#dff3ff",
      metal: "#e7eef2",
      water: "#76d2ff",
      earth: "#d2aa63",
      wood: "#77d678",
      siege: "#efbf61",
      resource: "#ffe08a"
    }[type] || "#f4ead5";
  }

  function bubbleColor(type) {
    return {
      attack: "rgba(125,45,34,.9)",
      defense: "rgba(58,79,108,.9)",
      heal: "rgba(46,99,61,.9)",
      control: "rgba(86,60,111,.9)",
      ultimate: "rgba(132,82,27,.94)",
      ok: "rgba(61,105,50,.9)"
    }[type] || "rgba(32,35,31,.9)";
  }

  function drawScreenSelection() {
    if (!state.mouse.drag) return;
    const d = state.mouse.drag;
    const x = Math.min(d.x, state.mouse.x);
    const y = Math.min(d.y, state.mouse.y);
    const w = Math.abs(d.x - state.mouse.x);
    const h = Math.abs(d.y - state.mouse.y);
    ctx.save();
    ctx.fillStyle = "rgba(80,142,230,.14)";
    ctx.strokeStyle = "rgba(130,180,255,.8)";
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function drawMinimap() {
    state.needsMini = false;
    miniCtx.clearRect(0, 0, minimap.width, minimap.height);
    const sx = minimap.width / WORLD_W;
    const sy = minimap.height / WORLD_H;
    const cols = state.terrain[0]?.length || 0;
    const rows = state.terrain.length;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        miniCtx.fillStyle = TERRAIN[state.terrain[y][x]]?.color || "#456";
        miniCtx.fillRect(x * TILE * sx, y * TILE * sy, Math.ceil(TILE * sx), Math.ceil(TILE * sy));
      }
    }
    for (const b of state.buildings) {
      if (b.dead) continue;
      miniCtx.fillStyle = b.owner === "player" ? FACTIONS[state.faction].color : "#d5473c";
      miniCtx.fillRect(b.x * sx - 2, b.y * sy - 2, 4, 4);
    }
    for (const u of state.units) {
      if (u.dead) continue;
      miniCtx.fillStyle = u.owner === "player" ? "#58a5ff" : "#ff5548";
      miniCtx.fillRect(u.x * sx - 1, u.y * sy - 1, 2, 2);
    }
    const vw = window.innerWidth / state.camera.zoom * sx;
    const vh = window.innerHeight / state.camera.zoom * sy;
    miniCtx.strokeStyle = "#fff6c8";
    miniCtx.lineWidth = 1;
    miniCtx.strokeRect(state.camera.x * sx - vw / 2, state.camera.y * sy - vh / 2, vw, vh);
    ui.mapMeta.textContent = `战场 X:${Math.round(state.camera.x)} Y:${Math.round(state.camera.y)}`;
  }

  function bindEvents() {
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", (e) => state.keys.delete(e.code));
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("wheel", onWheel, { passive: false });
    minimap.addEventListener("click", onMiniClick);
    ui.startBtn.addEventListener("click", () => setupGame(state.selectedFactionDraft, state.selectedLevelDraft));
    ui.factionChoices.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-faction]");
      if (!btn) return;
      state.selectedFactionDraft = btn.dataset.faction;
      state.needsUi = true;
      renderMenuPages();
    });
    ui.menuLevelEntryBtn?.addEventListener("click", () => showMenuPage("levelSelect"));
    ui.menuLoadBtn?.addEventListener("click", () => loadGame());
    ui.menuSettingsBtn?.addEventListener("click", () => toast("战斗内设置已保留在右上角按钮中"));
    ui.menuGuideBtn?.addEventListener("click", () => toast("教程：选阵营与关卡后进入战场，框选工兵可建造，右键资源可采集"));
    ui.menuCodexBtn?.addEventListener("click", () => toast("图鉴入口已预留，当前版本可在战斗内通过卡片悬停查看单位与建筑详情"));
    ui.menuExitBtn?.addEventListener("click", () => toast("浏览器版本请直接关闭标签页"));
    ui.levelBackBtn?.addEventListener("click", () => showMenuPage("home"));
    ui.levelStartBtn?.addEventListener("click", () => setupGame(state.selectedFactionDraft, state.selectedLevelDraft));
    ui.levelCardGrid?.addEventListener("click", (e) => {
      const select = e.target.closest("[data-level-select]");
      const start = e.target.closest("[data-level-start]");
      if (select) {
        setSelectedLevelDraft(select.dataset.levelSelect);
        return;
      }
      if (start) {
        setSelectedLevelDraft(start.dataset.levelStart);
        setupGame(state.selectedFactionDraft, state.selectedLevelDraft);
        return;
      }
      const card = e.target.closest("[data-level-card]");
      if (card) setSelectedLevelDraft(card.dataset.levelCard);
    });
    ui.sideCommands.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-context-command]");
      if (!btn) return;
      handleContextCommand(btn.dataset.contextCommand, btn.dataset.source);
      state.needsUi = true;
    });
    ui.settingsBtn.addEventListener("click", () => {
      state.settingsOpen = !state.settingsOpen;
      state.needsUi = true;
    });
    ui.settingsPanel.addEventListener("click", onSettingsClick);
    ui.settingsPanel.addEventListener("change", onSettingsClick);
    ui.bottomHud.addEventListener("click", onHudClick);
    ui.groupBar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-group]");
      if (!btn) return;
      selectGroup(Number(btn.dataset.group));
    });
  }

  function onKeyDown(e) {
    state.keys.add(e.code);
    if (!state.started) return;
    if (e.code === "Escape") {
      state.buildMode = null;
      state.commandMode = "select";
      state.settingsOpen = false;
      hideTip();
      state.needsUi = true;
    }
    if (e.code === "Space") focusSelection();
    if (e.code === "KeyB") {
      if (selectedBuilders().length) state.panelTab = "build";
      else {
        state.panelTab = "";
        state.buildMode = null;
        toast("需要选中工兵才能建造", "bad");
      }
      state.needsUi = true;
    }
    if (e.code === "KeyT") {
      state.panelTab = "tech";
      state.needsUi = true;
    }
    if (e.code === "KeyF") {
      state.panelTab = "skills";
      state.needsUi = true;
    }
    if (/^Digit[0-9]$/.test(e.code)) {
      const n = e.code === "Digit0" ? 9 : Number(e.code.replace("Digit", "")) - 1;
      if (e.ctrlKey || e.metaKey) bindGroup(n);
      else selectGroup(n);
    }
    if (e.code === "Delete") deleteSelected();
  }

  function onMouseMove(e) {
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
    const w = screenToWorld(e.clientX, e.clientY);
    state.mouse.worldX = w.x;
    state.mouse.worldY = w.y;
  }

  function onMouseDown(e) {
    if (!state.started) return;
    state.mouse.down = true;
    state.mouse.button = e.button;
    const w = screenToWorld(e.clientX, e.clientY);
    state.mouse.worldX = w.x;
    state.mouse.worldY = w.y;
    if (e.button === 0) {
      if (state.buildMode) {
        tryPlaceBuilding(state.buildMode, w.x, w.y);
        return;
      }
      state.mouse.drag = { x: e.clientX, y: e.clientY, worldX: w.x, worldY: w.y };
    }
    if (e.button === 2) {
      e.preventDefault();
      handleRightClick(w.x, w.y);
    }
  }

  function onMouseUp(e) {
    if (!state.started) return;
    if (e.button !== 0) return;
    state.mouse.down = false;
    const drag = state.mouse.drag;
    state.mouse.drag = null;
    const w = screenToWorld(e.clientX, e.clientY);
    if (!drag) return;
    const moved = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
    if (moved > 8) {
      const x1 = Math.min(drag.worldX, w.x);
      const x2 = Math.max(drag.worldX, w.x);
      const y1 = Math.min(drag.worldY, w.y);
      const y2 = Math.max(drag.worldY, w.y);
      const units = playerUnits().filter((u) => u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2);
      selectObjects(units, e.shiftKey);
      return;
    }
    const hit = hitTest(w.x, w.y);
    if (hit) {
      if (state.commandMode === "attack" && hit.owner !== "player") {
        issueAttack(hit);
        state.commandMode = "select";
      } else selectObjects([hit], e.shiftKey);
    } else {
      const node = resourceNodeAt(w.x, w.y);
      if (node) {
        createDecal(node.x, node.y, node.r + 22, "gather", 0.75, "player");
        floating(node.x, node.y - node.r - 8, `${RES[node.type].name} ${Math.ceil(node.amount)}`, "resource");
        if (selectedWorkers().length) toast("右键该资源可指定工人采集");
        return;
      }
      if (!e.shiftKey) selectObjects([]);
    }
  }

  function handleRightClick(x, y) {
    if (state.commandMode === "setRally") {
      const buildings = selectedObjects().filter((o) => o.kind === "building");
      if (buildings.length) {
        for (const b of buildings) {
          b.rally = { x, y };
          bubble(b, "集结点", "normal");
        }
        addCommandFeedback(x, y, "move");
        toast("集结点已设置");
      }
      state.commandMode = "select";
      state.needsUi = true;
      return;
    }
    const target = hitTest(x, y);
    const workers = selectedWorkers();
    const resourceNode = resourceNodeAt(x, y);
    if (target && target.owner !== "player") issueAttack(target);
    else if (state.commandMode === "gather" || (workers.length && resourceNode)) orderGatherAt(x, y, workers);
    else issueMove(x, y, state.commandMode === "attack");
    state.commandMode = "select";
    state.needsUi = true;
  }

  function onWheel(e) {
    e.preventDefault();
    const old = state.camera.zoom;
    const next = clamp(old * (e.deltaY < 0 ? 1.08 : 0.92), 0.55, 1.55);
    const before = screenToWorld(e.clientX, e.clientY);
    state.camera.zoom = next;
    const after = screenToWorld(e.clientX, e.clientY);
    state.camera.x += before.x - after.x;
    state.camera.y += before.y - after.y;
    panCamera(0, 0);
  }

  function onMiniClick(e) {
    const rect = minimap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * WORLD_W;
    const y = (e.clientY - rect.top) / rect.height * WORLD_H;
    state.camera.x = clamp(x, 0, WORLD_W);
    state.camera.y = clamp(y, 0, WORLD_H);
    state.needsMini = true;
  }

  function onHudClick(e) {
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      state.panelTab = tab.dataset.tab;
      state.needsUi = true;
      return;
    }
    const bc = e.target.closest("[data-build-category]");
    if (bc) {
      state.buildCategory = bc.dataset.buildCategory;
      state.needsUi = true;
      return;
    }
    const cc = e.target.closest("[data-card-category]");
    if (cc) {
      state.cardCategory = cc.dataset.cardCategory;
      state.needsUi = true;
      return;
    }
    const card = e.target.closest("[data-card-kind][data-action]");
    if (card && card.dataset.action) {
      const kind = card.dataset.cardKind;
      const id = card.dataset.cardId;
      if (card.dataset.action === "build") {
        if (!selectedBuilders().length) {
          state.panelTab = "command";
          state.buildMode = null;
          state.commandMode = "select";
          toast("需要选中工兵才能建造", "bad");
          state.needsUi = true;
          return;
        }
        state.buildMode = id;
        state.commandMode = "build";
        toast(`建造规划：${BUILDINGS[id].name}`);
      }
      if (card.dataset.action === "train") {
        trainUnit(objectById(Number(card.dataset.source)), id);
      }
      if (card.dataset.action === "research") {
        researchTech(objectById(Number(card.dataset.source)), id);
      }
      state.needsUi = true;
      return;
    }
    const ability = e.target.closest("[data-ability]");
    if (ability) {
      const id = ability.dataset.ability;
      if (id.startsWith("arrow:")) setArrowMode(id.split(":")[1]);
      else if (id.startsWith("formation:")) setFormation(id.split(":")[1]);
      else useAbility(id);
      return;
    }
    const action = e.target.closest("[data-action='set-rally']");
    if (action) {
      const b = objectById(Number(action.dataset.id));
      if (b) {
        state.commandMode = "setRally";
        toast("集结点规划");
      }
    }
  }

  function onSettingsClick(e) {
    const target = e.target.closest("[data-setting-action]");
    if (!target) return;
    const action = target.dataset.settingAction;
    if (action === "close") state.settingsOpen = false;
    if (action === "pause") state.paused = !state.paused;
    if (action === "speed") state.speed = Number(target.dataset.value) || 1;
    if (action === "toggleHp") state.showHpBars = target.checked;
    if (action === "toggleDamage") state.showDamageText = target.checked;
    if (action === "toggleNames") state.showSelectionNames = target.checked;
    if (action === "save") saveGame();
    if (action === "load") loadGame();
    if (action === "restart") setupGame(state.faction);
    state.needsUi = true;
  }

  function handleContextCommand(id, source) {
    if (id === "gather") {
      orderGather(selectedWorkers());
      return;
    }
    if (id === "cancelBuild") {
      state.buildMode = null;
      state.commandMode = "select";
      toast("建造规划已取消");
      return;
    }
    if (id === "setRally") {
      const b = objectById(Number(source)) || selectedObjects().find((o) => o.kind === "building");
      if (b) {
        state.commandMode = "setRally";
        toast("集结点规划");
      }
      return;
    }
    if (id === "townUpgrade") {
      useAbility("townUpgrade");
    }
  }

  function orderGather(units = selectedWorkers()) {
    const workers = units.filter(isWorkerUnit);
    if (!workers.length) {
      toast("没有可采集的工人", "bad");
      return 0;
    }
    for (const u of workers) {
      u.moveTarget = null;
      u.targetId = null;
      u.order = "gather";
      u.gatherTarget = null;
      markFx(u, "order", 0.55);
    }
    if (workers[0]) bubble(workers[0], "自动采集", "normal");
    state.buildMode = null;
    state.commandMode = "select";
    state.needsUi = true;
    toast(`${workers.length} 个工人开始自动采集`);
    return workers.length;
  }

  function resourceNodeAt(x, y) {
    return state.resourcesNodes.find((n) => n.amount > 0 && distXY(x, y, n.x, n.y) < n.r + 40);
  }

  function orderGatherAt(x, y, units = selectedWorkers()) {
    const workers = units.filter(isWorkerUnit);
    if (!workers.length) {
      toast("没有可采集的工人", "bad");
      return 0;
    }
    const node = resourceNodeAt(x, y);
    if (!node) return issueMove(x, y, false);
    for (const u of workers) {
      u.moveTarget = null;
      u.targetId = null;
      u.order = "gather";
      u.gatherTarget = node.id;
      markFx(u, "order", 0.55);
      addBeam(u.x, u.y, node.x, node.y, RES[node.type].color, 0.22, 2);
    }
    createDecal(node.x, node.y, node.r + 24, "gather", 1.2, "player");
    addParticle(node.x, node.y, RES[node.type].color, 16, 4);
    floating(node.x, node.y - node.r - 8, `${RES[node.type].name}目标`, "resource");
    if (workers[0]) bubble(workers[0], `采集${RES[node.type].name}`, "normal");
    state.buildMode = null;
    state.commandMode = "select";
    state.needsUi = true;
    toast(`采集${RES[node.type].name}`);
    return workers.length;
  }

  function bindGroup(index) {
    const ids = selectedObjects().filter((o) => o.kind === "unit").map((o) => o.id);
    state.groups[index] = ids;
    toast(`编队 ${index === 9 ? 0 : index + 1} 已绑定`);
    state.needsUi = true;
  }

  function selectGroup(index) {
    const ids = state.groups[index].filter((id) => objectById(id));
    if (!ids.length) return;
    state.selected = ids;
    focusSelection();
    state.needsUi = true;
  }

  function focusSelection() {
    const sel = selectedObjects();
    if (!sel.length) return;
    state.camera.x = sel.reduce((a, o) => a + o.x, 0) / sel.length;
    state.camera.y = sel.reduce((a, o) => a + o.y, 0) / sel.length;
    panCamera(0, 0);
  }

  function deleteSelected() {
    for (const o of selectedObjects()) {
      if (o.kind === "building" && o.type !== "townCenter" && o.type !== "fusionCore") killBuilding(o);
    }
  }

  function saveGame() {
    const save = {
      faction: state.faction,
      levelPresetId: state.levelPresetId,
      time: state.time,
      townLevel: state.townLevel,
      enemyTownLevel: state.enemyTownLevel,
      resources: state.resources,
      enemyResources: state.enemyResources,
      enemyTechs: [...state.enemyTechs],
      enemyModifiers: state.enemyModifiers,
      researched: [...state.researched],
      units: state.units.filter((u) => !u.dead).map(stripRuntime),
      buildings: state.buildings.filter((b) => !b.dead).map(stripRuntime),
      nextId: state.nextId
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    toast("进度已保存");
  }

  function stripRuntime(o) {
    const copy = { ...o };
    delete copy.selected;
    delete copy.fx;
    return copy;
  }

  function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return toast("没有本地存档", "bad");
    try {
      const save = JSON.parse(raw);
      setupGame(save.faction || "huaxia", save.levelPresetId || state.selectedLevelDraft || "balanced");
      state.time = save.time || 0;
      state.townLevel = save.townLevel || 1;
      state.enemyTownLevel = save.enemyTownLevel || 1;
      state.resources = { ...state.resources, ...save.resources };
      state.enemyResources = { ...state.enemyResources, ...(save.enemyResources || {}) };
      state.enemyTechs = new Set(save.enemyTechs || []);
      state.enemyModifiers = { ...state.enemyModifiers, ...(save.enemyModifiers || {}) };
      state.researched = new Set(save.researched || []);
      state.units = save.units || [];
      state.buildings = save.buildings || [];
      state.nextId = save.nextId || 9999;
      state.selected = [];
      state.needsUi = true;
      state.needsMini = true;
      toast("进度已读取");
    } catch (err) {
      console.error(err);
      toast("存档读取失败", "bad");
    }
  }

  function renderFactionChoices() {
    ui.factionChoices.innerHTML = Object.entries(FACTIONS).map(([id, f]) => `
      <button class="faction-choice ${state.selectedFactionDraft === id ? "active" : ""}" data-faction="${id}">
        <div class="faction-art">${assetImg("faction", id, 120, 72)}</div>
        <div>
          <div class="faction-name">${f.name}</div>
          <div class="faction-desc">${f.subtitle}<br>${f.special}</div>
        </div>
      </button>
    `).join("");
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - state.lastFrame) / 1000);
    state.lastFrame = now;
    update(dt);
    renderWorld();
    requestAnimationFrame(loop);
  }

  function boot() {
    resize();
    bindEvents();
    applyLevelPreset(state.selectedLevelDraft);
    generateTerrain();
    initResourceNodes();
    showMenuPage("home");
    renderMenuPages();
    setBattleHudVisible(false);
    renderWorld();
    requestAnimationFrame(loop);
  }

  boot();
})();
