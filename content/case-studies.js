// 真实案例的唯一内容源。Offer 决定搜索和地区归属，最终选择决定案例标题。
const SCHOOLS = {
  Austin: { label: "Austin", school: "University of Texas at Austin", schoolCn: "德州大学奥斯汀分校", region: "US", country: "United States", countryCn: "美国", aliases: ["Austin", "UT Austin", "University of Texas at Austin", "德州大学奥斯汀分校", "美国"] },
  CMU: { label: "CMU", school: "Carnegie Mellon University", schoolCn: "卡内基梅隆大学", region: "US", country: "United States", countryCn: "美国", aliases: ["CMU", "Carnegie Mellon University", "卡内基梅隆大学", "美国"] },
  GaTech: { label: "GaTech", school: "Georgia Institute of Technology", schoolCn: "佐治亚理工学院", region: "US", country: "United States", countryCn: "美国", aliases: ["GaTech", "Georgia Tech", "Georgia Institute of Technology", "佐治亚理工学院", "美国"] },
  GSD: { label: "GSD", school: "Harvard Graduate School of Design", schoolCn: "哈佛大学设计学院", region: "US", country: "United States", countryCn: "美国", aliases: ["GSD", "Harvard", "Harvard Graduate School of Design", "哈佛大学", "哈佛大学设计学院", "美国"] },
  IUB: { label: "IUB", school: "Indiana University Bloomington", schoolCn: "印第安纳大学布鲁明顿分校", region: "US", country: "United States", countryCn: "美国", aliases: ["IUB", "Indiana University Bloomington", "印第安纳大学布鲁明顿分校", "美国"] },
  MIT: { label: "MIT", school: "Massachusetts Institute of Technology", schoolCn: "麻省理工学院", region: "US", country: "United States", countryCn: "美国", aliases: ["MIT", "Massachusetts Institute of Technology", "麻省理工学院", "美国"] },
  NWU: { label: "NWU", school: "Northwestern University", schoolCn: "西北大学", region: "US", country: "United States", countryCn: "美国", aliases: ["NWU", "Northwestern University", "西北大学", "美国"] },
  NYU: { label: "NYU", school: "New York University", schoolCn: "纽约大学", region: "US", country: "United States", countryCn: "美国", aliases: ["NYU", "New York University", "纽约大学", "美国"] },
  SFU: { label: "SFU", school: "Simon Fraser University", schoolCn: "西蒙菲莎大学", region: "CAN", country: "Canada", countryCn: "加拿大", aliases: ["SFU", "Simon Fraser University", "西蒙菲莎大学", "Canada", "加拿大"] },
  UBC: { label: "UBC", school: "University of British Columbia", schoolCn: "英属哥伦比亚大学", region: "CAN", country: "Canada", countryCn: "加拿大", aliases: ["UBC", "University of British Columbia", "英属哥伦比亚大学", "Canada", "加拿大"] },
  UCB: { label: "UCB", school: "University of California, Berkeley", schoolCn: "加州大学伯克利分校", region: "US", country: "United States", countryCn: "美国", aliases: ["UCB", "UC Berkeley", "University of California, Berkeley", "加州大学伯克利分校", "美国"] },
  UMD: { label: "UMD", school: "University of Maryland", schoolCn: "马里兰大学", region: "US", country: "United States", countryCn: "美国", aliases: ["UMD", "University of Maryland", "马里兰大学", "美国"] },
  Umich: { label: "Umich", school: "University of Michigan", schoolCn: "密歇根大学", region: "US", country: "United States", countryCn: "美国", aliases: ["Umich", "UMich", "University of Michigan", "密歇根大学", "美国"] },
  UofT: { label: "UofT", school: "University of Toronto", schoolCn: "多伦多大学", region: "CAN", country: "Canada", countryCn: "加拿大", aliases: ["UofT", "University of Toronto", "多伦多大学", "Canada", "加拿大"] },
  Upenn: { label: "Upenn", school: "University of Pennsylvania", schoolCn: "宾夕法尼亚大学", region: "US", country: "United States", countryCn: "美国", aliases: ["Upenn", "UPenn", "Penn", "University of Pennsylvania", "宾夕法尼亚大学", "美国"] },
  UW: { label: "UW", school: "University of Washington", schoolCn: "华盛顿大学", region: "US", country: "United States", countryCn: "美国", aliases: ["UW", "University of Washington", "华盛顿大学", "美国"] }
};

const FINAL_PROGRAMS = {
  MCDM: { label: "MCDM", program: "Master of Communication in Digital Media", aliases: ["MCDM", "Master of Communication in Digital Media", "Digital Media"] },
  MDes: { label: "MDes", program: "Master of Design", aliases: ["MDes", "Master of Design"] },
  MIIPS: { label: "MIIPS", program: "Master of Integrated Innovation for Products & Services", aliases: ["MIIPS", "Master of Integrated Innovation for Products & Services", "Integrated Innovation"] },
  MSI: { label: "MSI", program: "M.S. in Information", aliases: ["MSI", "M.S. in Information", "MS in Information", "Information"] },
  MSIM: { label: "MSIM", program: "MS in Information Management", aliases: ["MSIM", "MS in Information Management", "Information Management"] },
  MSTI: { label: "MSTI", program: "MS in Technology Innovation", aliases: ["MSTI", "MS in Technology Innovation", "Technology Innovation", "Innovation"] }
};

const APPLICATION_METHODS = new Set([
  "作品集辅导",
  "作品集DIY",
  "作品集半DIY",
  "文书辅导",
  "文书DIY",
  "文书半DIY"
]);

function outcome(schoolCode, status) {
  return { ...SCHOOLS[schoolCode], status };
}

function buildCase({ id, language, background, gpa, services, offers, selected, rejected, status = "published" }) {
  const selectedSchool = outcome(selected.school, "selected");
  const selectedProgram = FINAL_PROGRAMS[selected.program];
  const offerCodes = offers.filter((code) => code !== selected.school);
  const outcomes = [
    selectedSchool,
    ...offerCodes.map((code) => outcome(code, "offer")),
    ...rejected.map((code) => outcome(code, "rejected"))
  ];
  const offerOutcomes = outcomes.filter((item) => item.status !== "rejected");

  return {
    id,
    status,
    year: "2024 Fall",
    title: `${selectedSchool.label} ${selectedProgram.label}`,
    selected: { school: selectedSchool, program: selectedProgram },
    regions: [...new Set(offerOutcomes.map((item) => item.region))],
    background,
    gpa,
    language,
    applicationMethods: services.filter((service) => APPLICATION_METHODS.has(service)),
    supportServices: services.filter((service) => !APPLICATION_METHODS.has(service)),
    outcomes,
    searchTerms: [
      id,
      background,
      language,
      gpa,
      ...services,
      selectedSchool.label,
      selectedSchool.school,
      selectedSchool.schoolCn,
      ...selectedSchool.aliases,
      selectedProgram.label,
      selectedProgram.program,
      ...selectedProgram.aliases,
      ...offerOutcomes.flatMap((item) => [item.label, item.school, item.schoolCn, ...item.aliases])
    ]
  };
}

function buildCaseTagCatalog(programs) {
  const schoolsByName = new Map();
  const programsById = new Map();
  const addSchool = (item) => {
    if (!schoolsByName.has(item.school)) {
      schoolsByName.set(item.school, {
        id: item.school,
        label: item.label || item.school,
        school: item.school,
        schoolCn: item.schoolCn || "",
        aliases: [...new Set([item.label, item.school, item.schoolCn, ...(item.aliases || [])].filter(Boolean))]
      });
    }
  };
  const addProgram = (item) => {
    if (!programsById.has(item.id)) {
      programsById.set(item.id, {
        id: item.id,
        label: item.label,
        program: item.program,
        aliases: [...new Set([item.label, item.program, ...(item.aliases || [])].filter(Boolean))]
      });
    }
  };

  programs.forEach((program) => {
    addSchool({
      school: program.school,
      schoolCn: program.schoolCn,
      aliases: [program.school, program.schoolCn]
    });
    addProgram({
      id: program.id,
      label: program.programShort || program.short || program.program,
      program: program.program,
      aliases: [program.short, program.programShort, program.program]
    });
  });
  Object.values(SCHOOLS).forEach(addSchool);
  Object.entries(FINAL_PROGRAMS).forEach(([id, program]) => addProgram({
    id: `manual-${id.toLowerCase()}`,
    ...program
  }));

  return {
    schools: [...schoolsByName.values()],
    programs: [...programsById.values()]
  };
}

window.CASE_STUDIES = [
  buildCase({
    id: "2024-fall-c",
    language: "Waive",
    background: "美本 Graphic Design，2 年工作经验",
    gpa: "3.8 / 4.0",
    services: ["作品集辅导", "作品集DIY", "作品集半DIY", "文书辅导", "文书DIY", "选校服务"],
    offers: ["UofT", "SFU", "UBC", "CMU", "Umich"],
    selected: { school: "CMU", program: "MIIPS" },
    rejected: ["Upenn", "GaTech", "UW"]
  }),
  buildCase({
    id: "2024-fall-t",
    language: "IELTS 7.0",
    background: "陆本 211 建筑，无工作实习",
    gpa: "3.5 / 4.0",
    services: ["作品集辅导", "选校服务", "文书DIY"],
    offers: ["Umich", "CMU", "IUB", "UW", "GaTech"],
    selected: { school: "UW", program: "MCDM" },
    rejected: ["UMD", "UCB", "Upenn"]
  }),
  buildCase({
    id: "2024-fall-l",
    language: "TOEFL 102",
    background: "陆本 985 工业设计，无工作实习",
    gpa: "3.4 / 4.0",
    services: ["作品集辅导", "选校服务", "文书DIY"],
    offers: ["Umich", "CMU", "NYU", "IUB"],
    selected: { school: "Umich", program: "MSI" },
    rejected: ["UW", "GaTech", "NWU", "Upenn"]
  }),
  buildCase({
    id: "2024-fall-p",
    language: "TOEFL 102",
    background: "陆本双非景观设计，一段设计院实习",
    gpa: "3.6 / 4.0",
    services: ["作品集辅导", "选校服务", "文书辅导"],
    offers: ["UW", "Umich", "NYU", "IUB"],
    selected: { school: "UW", program: "MSIM" },
    rejected: ["GSD", "MIT", "Upenn"]
  }),
  buildCase({
    id: "2024-fall-j",
    language: "Waive",
    background: "美本室内设计，1 年创业与工作经验",
    gpa: "3.6 / 4.0",
    services: ["文书辅导", "作品集辅导", "选校服务"],
    offers: ["NYU", "UW", "CMU", "GaTech"],
    selected: { school: "CMU", program: "MIIPS" },
    rejected: ["NWU", "UCB", "Upenn"]
  }),
  buildCase({
    id: "2024-fall-k",
    language: "TOEFL 100",
    background: "陆本 211 景观设计，无工作实习经验",
    gpa: "3.5 / 4.0",
    services: ["作品集辅导", "选校服务", "文书DIY"],
    offers: ["IUB", "UMD", "Austin"],
    selected: { school: "UW", program: "MSTI" },
    rejected: ["CMU", "Umich", "GaTech", "Upenn"]
  }),
  buildCase({
    id: "2024-fall-small-l",
    language: "Waive",
    background: "美本 CS + Engineering，无工作实习经验",
    gpa: "3.9 / 4.0",
    services: ["文书辅导", "作品集辅导", "选校服务"],
    offers: ["UW", "UCB", "CMU", "Upenn"],
    selected: { school: "UCB", program: "MDes" },
    rejected: ["NWU"]
  })
];

window.CASE_TAG_CATALOG = buildCaseTagCatalog(window.PROGRAMS || []);
