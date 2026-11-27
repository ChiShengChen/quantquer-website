export const solutions = [
  {
    id: 'semiconductor-edge-ai',
    service: 'edge-ai',
    name: ['半導體與邊緣 AI', 'Semiconductor & Edge AI'],
    headline: ['讓生成式影像模型在目標裝置上運行', 'Make generative vision work on the target device'],
    intro: ['為 SoC、相機與嵌入式產品團隊評估模型在裝置上的精度、延遲、記憶體和功耗，逐步完成模型轉換、Runtime 整合及裝置驗收。', 'For SoC, imaging, and embedded product teams, we assess model quality, latency, memory, and power on the device, then scope conversion, runtime integration, and acceptance tests.'],
    problems: [
      ['桌面 GPU 原型能產生影像，但目標 Runtime 缺少部分算子或限制輸入形狀。', 'A desktop GPU prototype produces good images while the target runtime lacks operators or constrains input shapes.'],
      ['低精度轉換及影片逐幀處理可能影響顏色、邊界或跨幀一致性。', 'Lower precision and frame-by-frame processing can change color, mask boundaries, or temporal consistency.'],
      ['裝置的散熱、記憶體峰值和資料搬移常比單一模型推論更早成為瓶頸。', 'Thermal limits, peak memory, and data transfer can become bottlenecks before model inference itself.'],
    ],
    engineering: [
      ['逐段量測前處理、模型、後處理與資料搬移，建立可重跑基線。', 'Measure preprocessing, inference, postprocessing, and data transfer separately to establish a reproducible baseline.'],
      ['檢查算子與精度支援，依需求比較靜態形狀、剪枝、量化與轉換替代方案。', 'Check operator and precision support, then compare static shapes, pruning, quantization, or alternative conversion paths where appropriate.'],
      ['用受控樣本比較精度和影像品質，於指定裝置重跑延遲、記憶體與持續負載試驗。', 'Compare accuracy and image quality on controlled samples, then repeat latency, memory, and sustained-load tests on the device.'],
    ],
    architecture: [
      [['輸入與前處理', 'Input and preprocessing'], ['固定解析度、遮罩與座標規則', 'Fixed resolution, mask, and coordinate rules']],
      [['模型與算子', 'Model and operators'], ['模型轉換、精度配置、相容性檢查', 'Conversion, precision profile, and compatibility checks']],
      [['裝置 Runtime', 'Target runtime'], ['NPU／GPU／CPU 後端與記憶體量測', 'NPU, GPU, or CPU backend and memory measurements']],
      [['裝置驗收', 'Device acceptance'], ['輸出品質、端到端延遲與持續執行', 'Output quality, end-to-end latency, and sustained execution']],
    ],
    uses: [
      ['相機端人物移除與背景修補', 'On-device human removal and background inpainting'],
      ['視覺模型轉換與 NPU 可行性評估', 'Vision model conversion and NPU feasibility assessment'],
      ['嵌入式生成式影像管線與效能預算', 'Embedded generative vision pipelines and performance budgets'],
    ],
    cases: ['on-device-generative-vision', 'fall-detection'],
    evidence: [
      { label: ['查看 MI-GAN-512 輸入與輸出', 'Inspect MI-GAN-512 inputs and outputs'], route: '/labs/evidence/vision/', languageQuery: true, detail: ['受控圖片上的公開模型桌面 CPU 實測，含對照方法、版本和測試條件。', 'A desktop CPU run of a public model on controlled images, with a comparison method, versions, and test conditions.'] },
    ],
    deliverables: [
      ['算子相容性評估與風險紀錄', 'Operator compatibility assessment and risk register'],
      ['依範圍提供最佳化模型、Runtime 整合程式及部署說明', 'Optimized model artifacts, runtime integration code, and deployment notes where scoped'],
      ['裝置基準報告、影像品質評估與可重跑驗收程序', 'Device benchmark, image quality evaluation, and reproducible acceptance procedure'],
    ],
    engagements: ['edge-feasibility', 'deep-tech-rd'],
    faq: [
      [['能承諾指定 NPU 的延遲嗎？', 'Can you guarantee a latency on a specific NPU?'], ['確認晶片、SDK、輸入尺寸與功耗後，先在目標裝置建立基準，交付驗收條件以該結果共同議定。', 'We first benchmark the target device using the agreed chip, SDK, input dimensions, and power limits. Those measurements inform the acceptance criteria.']],
      [['可從現有 PyTorch 或 ONNX 模型開始嗎？', 'Can you start with an existing PyTorch or ONNX model?'], ['可以。準備模型來源、權重授權與代表性樣本，並列出已嘗試的 Runtime 或轉換工具。', 'Yes. Share the model provenance, weight license, representative inputs, and the runtimes or conversion tools already tried.']],
    ],
  },
  {
    id: 'enterprise-ai',
    service: 'knowledge-base',
    name: ['企業 AI 與知識工程', 'Enterprise AI & Knowledge Engineering'],
    headline: ['讓技術支援的答案可回查、可覆核', 'Give technical support answers a traceable source'],
    intro: ['為設備、製造與企業支援團隊建立會辨認文件版本、回查證據、保留覆核入口的知識系統與 Agent 工作流程。', 'We build knowledge systems and agent workflows for equipment, manufacturing, and enterprise support teams that resolve document versions, show evidence, and give reviewers a clear handoff.'],
    problems: [
      ['同一故障碼的處理方式會因設備版本、零件和區域政策而異。', 'The same fault code can require different procedures by equipment version, component, or regional policy.'],
      ['相關段落還需要對應到正確產品，錯用文件可能拖長停機時間。', 'A relevant passage still has to apply to the right product. A wrong manual can lengthen downtime.'],
      ['跨系統查詢可能接觸不同權限的資料，覆核者需要知道採用了哪一份資料。', 'Cross-system queries may reach data under different permissions. Reviewers need to know which source was used.'],
    ],
    engineering: [
      ['為文件版本、適用範圍、權威層級與存取權限建立資料模型。', 'Model document versions, applicability, source authority, and access permissions.'],
      ['把檢索、衝突裁決、引用驗證和人工覆核拆成可重播的工作步驟。', 'Make retrieval, conflict arbitration, citation verification, and human review replayable workflow steps.'],
      ['以代表性案例量測答案與引用正確性、拒答品質及後續處理時間。', 'Measure answer and citation accuracy, the quality of abstentions, and downstream handling time on representative cases.'],
    ],
    architecture: [
      [['知識來源', 'Source corpus'], ['設備手冊、版本、權限', 'Manuals, versions, and permissions']],
      [['檢索與裁決', 'Retrieve and resolve'], ['查找證據、依規則處理衝突', 'Find evidence and resolve conflicts by policy']],
      [['驗證與覆核', 'Verify and review'], ['核對引用、記錄理由、必要時轉交', 'Check citations, log rationale, and escalate when needed']],
      [['工作流程', 'Workflow'], ['支援工單、版本更新與驗收追蹤', 'Support tickets, version updates, and acceptance tracking']],
    ],
    uses: [
      ['設備手冊及版本衝突處理', 'Equipment documentation and version conflicts'],
      ['專家覆核的售後技術支援', 'Expert-reviewed technical support'],
      ['將內部知識查詢接入既有工單流程', 'Knowledge retrieval within an existing support workflow'],
    ],
    cases: ['enterprise-knowledge-arbitration', 'research-automation'],
    evidence: [
      { label: ['試用文件衝突裁決', 'Try document conflict arbitration'], route: '/labs/demos/knowledge-arbitration/', languageQuery: true, detail: ['使用公開可檢查的合成手冊，逐步查看版本、適用條件及引用。', 'Step through versions, applicability, and citations using inspectable synthetic manuals.'] },
      { label: ['檢視設備知識庫歷史評測', 'Review the historical equipment knowledge evaluation'], case: 'enterprise-knowledge-arbitration', detail: ['案例區分答覆與引用的評測範圍，成果受當時的題組與資料限制。', 'The case describes the evaluation scope for answers and citations, limited to its reference questions and corpus.'] },
    ],
    deliverables: [
      ['文件資料模型與權限規則', 'Document model and permissions policy'],
      ['可查證引用的原型、衝突規則及覆核流程', 'A traceable citation prototype, conflict rules, and a review workflow'],
      ['評測集、版本更新程序與運行文件', 'Evaluation set, version-update procedure, and operating documentation'],
    ],
    engagements: ['architecture-assessment', 'agent-poc'],
    faq: [
      [['可以在現行系統內部署嗎？', 'Can this run inside our existing system?'], ['先驗證身份、索引、產品資料更新與支援工作流程，再選擇私有環境或既有平台的整合方式。', 'We first verify identity, indexing, product-data updates, and support workflows, then choose how to integrate with your private environment or existing platform.']],
      [['可評估現有的 RAG 嗎？', 'Can you evaluate our existing RAG system?'], ['可以。評估會分開檢查找到正確文件、選用正確版本，以及最後答案是否獲引用支持。', 'Yes. The evaluation tests retrieval, correct version choice, and whether the answer is supported by its citations separately.']],
    ],
  },
  {
    id: 'ai-reliability',
    service: 'agent',
    name: ['AI 可靠性工程', 'AI Reliability Engineering'],
    headline: ['讓企業 AI 任務可驗證、可量測、可改善', 'Reliable, measurable and efficient AI systems'],
    intro: ['為企業 Agent、研究工具及工作流程建立任務驗收規則、證據檢查、復原機制與每項成功任務的成本量測。', 'We design acceptance rules, evidence checks, recovery paths, and cost-per-success measurements for enterprise agents, research tools, and workflows.'],
    problems: [
      ['回答看似合理時，需要確認輸出是否完成任務、符合格式與權限要求。', 'A plausible answer still needs to satisfy the task, format, and permission requirements.'],
      ['工具失敗或引用找不到時，需要判斷是重試、回退或交由人工審查。', 'When a tool fails or a citation cannot be found, the workflow needs a defined retry, fallback, or human review path.'],
      ['Token 用量下降可能伴隨完成率下降，必須同時比較品質與成本。', 'Lower token use can come with lower completion rates. Quality and cost must be compared together.'],
    ],
    engineering: [
      ['定義任務成功條件與可重現題組，保存每一階段的輸入、輸出與失敗原因。', 'Define task success with a reproducible task set, preserving inputs, outputs, and failure causes at each stage.'],
      ['將引用、數字、權限和結構約束轉換為可重跑的驗證規則。', 'Convert citation, number, permission, and schema requirements into repeatable verification rules.'],
      ['在相同樣本比較單 Agent、規則驗證及多 Agent 工作流程的品質、延遲和成本。', 'Compare single-agent, rule-verified, and multi-agent workflows on equivalent tasks for quality, latency, and cost.'],
    ],
    architecture: [
      [['應用層', 'Application layer'], ['企業 Agent、研究 Agent 與工作流程', 'Enterprise agents, research agents, and workflows']],
      [['可靠性層', 'Reliability layer'], ['限制檢查、引用驗證與錯誤復原', 'Constraint checking, evidence validation, and error recovery']],
      [['評估層', 'Evaluation layer'], ['正確性、穩健性、證據與任務完成', 'Correctness, robustness, evidence, and task completion']],
      [['效率層', 'Efficiency layer'], ['Token、延遲、成本與模型路由', 'Token use, latency, cost, and model routing']],
    ],
    uses: [
      ['LLM 路由與每項成功任務的成本審計', 'LLM routing and cost-per-success audits'],
      ['上線前的企業 Agent 驗收與持續回歸測試', 'Pre-launch enterprise agent acceptance and ongoing regression checks'],
      ['需保留引用覆核和人工決策的研究流程', 'Research workflows with citation review and human decisions'],
    ],
    cases: ['enterprise-knowledge-arbitration', 'research-automation'],
    evidence: [
      { label: ['操作可靠性互動展示', 'Open the reliability demonstration'], route: '/labs/demos/reliability/', languageQuery: true, detail: ['以合成任務與模擬執行，比較基線、驗證與錯誤復原。', 'Compare a baseline, verification, and recovery using synthetic tasks and simulated execution.'] },
      { label: ['重播 Paper Evidence 引文查核', 'Replay Paper Evidence citation checks'], route: '/labs/evidence/research/', languageQuery: true, detail: ['開源引文查核核心在合成輸入上實際執行，可重播正確與錯誤的數字上下文。', 'Replay recorded outputs of the open-source verification core on synthetic text with valid and out-of-context numbers.'] },
      { label: ['TokenBench 原始碼', 'TokenBench source code'], external: 'https://github.com/ChiShengChen/tokenbench', detail: ['可查閱的評測工具，記錄嘗試次數、模型呼叫與用量，並支援確定性評分。', 'A publicly inspectable evaluation tool that records attempts, model calls, and usage with deterministic grading.'] },
      { label: ['sevencheck 原始碼', 'sevencheck source code'], external: 'https://github.com/ChiShengChen/sevencheck', detail: ['開源 Python 工具提供可由來源、數字或工作軌跡重跑的驗證規則。', 'An open-source Python toolkit for repeatable checks of sources, numbers, and workflow traces.'] },
    ],
    deliverables: [
      ['任務題組、可重現基線及評分規則', 'Task set, reproducible baseline, and scoring rules'],
      ['驗證與事故復原流程、人工覆核路徑', 'Verification and incident recovery workflow with human review'],
      ['延遲、Token、成本與品質取捨報告', 'Latency, token, cost, and quality trade-off report'],
    ],
    engagements: ['llm-audit', 'agent-poc'],
    faq: [
      [['能評估我們既有的模型和 Agent 嗎？', 'Can you evaluate the models and agents we already use?'], ['可以，先固定目前部署的模型版本與代表性任務。相同輸入、工具權限與計價方式可用於公平比較。', 'Yes. We fix the deployed model versions and representative tasks first. Equivalent inputs, tool permissions, and pricing assumptions make the comparison meaningful.']],
      [['每個檢查都需要另一個模型嗎？', 'Does every check need a second model?'], ['結構、允許值、來源匹配和數字上下文適合採確定性檢查。難以規則化的需求再選擇人工或模型評分，並保留評分範圍。', 'Schemas, allowed values, source matching, and number context are candidates for deterministic checks. Human or model judgment can cover requirements that resist explicit rules, within a stated evaluation scope.']],
    ],
  },
  {
    id: 'gpu-infrastructure',
    service: 'gpu-infrastructure',
    name: ['GPU 基礎設施與效能工程', 'GPU Infrastructure & Performance Engineering'],
    headline: ['讓多個 AI 工作負載穩定共用 GPU', 'Schedule shared GPU capacity around real workloads'],
    intro: ['為私有 AI、研發運算與模型服務團隊建立工作負載基準、資源准入、排程與維運量測。先把成本與瓶頸對到實際工作型態。', 'We help private AI, research compute, and model-serving teams establish workload baselines, resource admission, scheduling, and operating measurements from their actual workload mix.'],
    problems: [
      ['同張 GPU 上的推論與批次任務需要不同延遲目標，峰值記憶體卻彼此影響。', 'Inference and batch jobs share GPU memory peaks even when their latency requirements differ.'],
      ['排程看不到等待原因，難以區分記憶體限制、GPU 壅塞和 CPU 前處理瓶頸。', 'When a scheduler hides waiting reasons, memory pressure, GPU congestion, and CPU preprocessing are difficult to distinguish.'],
      ['不同部署配置和工作型態造成利用率差異，採購決策需要一致的比較方式。', 'Deployment settings and workload mixes change utilization. Procurement needs a consistent comparison.'],
    ],
    engineering: [
      ['量測各工作在不同資料量及 Batch 下的 GPU 記憶體、CPU、延遲和排隊時間。', 'Profile GPU memory, CPU, latency, and wait time across workload sizes and batches.'],
      ['比較排程規則、資源上限、隔離與失敗重試行為，記錄每項規則的取捨。', 'Compare scheduling, resource ceilings, isolation, and retry behavior while recording policy trade-offs.'],
      ['以遙測和基準結果定義容量、服務目標、監控和部署後回歸方式。', 'Use telemetry and benchmarks to define capacity, service targets, monitoring, and post-deployment regression tests.'],
    ],
    architecture: [
      [['工作隊列', 'Job queue'], ['推論、訓練或 CPU 任務描述', 'Requests for inference, training, or CPU jobs']],
      [['資源准入', 'Resource admission'], ['裝置、記憶體、優先序與並行上限', 'Devices, memory, priority, and concurrency limits']],
      [['執行環境', 'Execution environment'], ['單機或私有資源池、監控和失敗狀態', 'Host or private pool, monitoring, and failure states']],
      [['運行紀錄', 'Run record'], ['排隊、啟動、完成、利用率與重播', 'Queue, start, completion, utilization, and replay']],
    ],
    uses: [
      ['團隊共用的 GPU 工作站與私有資源池', 'Shared GPU workstations and private resource pools'],
      ['模型服務與離線工作同機的效能分析', 'Performance analysis for colocated model serving and offline jobs'],
      ['採購前的容量與運算成本比較', 'Capacity and compute cost comparison before procurement'],
    ],
    cases: ['gpu-orchestration', 'on-device-generative-vision'],
    evidence: [
      { label: ['重播單 GPU 控制實驗', 'Replay the controlled single-GPU run'], route: '/labs/evidence/gpu/', languageQuery: true, detail: ['單一裝置上的兩項 CUDA 任務與一項 CPU 任務，公開等待、開始、完成及抽樣記錄。', 'Inspect waiting, start, completion, and memory samples for two CUDA jobs and a CPU job on one device.'] },
      { label: ['比較 GPU 排程策略', 'Compare GPU scheduling policies'], route: '/labs/interactive/#gpu-orchestration', languageQuery: true, detail: ['用合成工作比較策略，獨立標示模擬條件。', 'Compare scheduling policies on synthetic jobs with the simulation conditions shown separately.'] },
    ],
    deliverables: [
      ['工作負載樣本、容量假設與成本／效能比較計畫', 'Workload sample, capacity assumptions, and a cost-performance comparison plan'],
      ['資源配置與排程原型、部署架構及監控設計', 'Resource and scheduling prototype, deployment architecture, and monitoring design'],
      ['基準結果、操作與故障處理手冊', 'Benchmark results, operating instructions, and failure handling runbook'],
    ],
    engagements: ['gpu-poc', 'architecture-assessment'],
    faq: [
      [['能直接用公開單 GPU 成果評估多機容量嗎？', 'Can the public single-GPU replay size a multi-host deployment?'], ['多機容量需要實際的工作混合、裝置和網路資料。單機紀錄讓您檢查量測方法與排程行為。', 'Multi-host sizing requires the workload mix, devices, and network details. The single-device record illustrates the measurement method and scheduling behavior.']],
      [['需提供雲端帳號嗎？', 'Do we need to provide cloud credentials?'], ['初談可用工作負載摘要與現有量測。後續環境存取依雙方規範與權限範圍確認。', 'Initial scoping can use workload summaries and existing measurements. Later environment access is defined within agreed security and permission boundaries.']],
    ],
  },
  {
    id: 'industrial-robotics',
    service: 'robotics',
    name: ['工業機器人與製造工程', 'Industrial Robotics & Manufacturing Engineering'],
    headline: ['把廠房限制轉成可審查的工作站設計', 'Turn factory constraints into reviewable robot workcells'],
    intro: ['將碼垛、搬運或工作站規劃的現場需求整理成可比較的佈局、機器人候選及驗收條件。', 'Turn palletizing, material handling, and workcell requirements into comparable layouts, robot candidates, and acceptance criteria.'],
    problems: [
      ['廠房空間、取放點、工件與安全區域缺少一致的標註方式。', 'Facility space, pick and place points, payloads, and safety zones lack consistent definitions.'],
      ['更換機器人或夾具會改變可達性、軌跡和估計節拍。', 'Changing the robot or gripper affects reachability, motion paths, and estimated cycle times.'],
      ['設備交付、安裝驗收與軟體估算需要不同的準則及記錄。', 'Equipment delivery, installation acceptance, and software estimates need different checks and records.'],
    ],
    engineering: [
      ['將文字需求、CAD、設備規格與空間限制整理成可反覆比較的輸入。', 'Turn verbal requirements, CAD, equipment specifications, and spatial constraints into reusable inputs.'],
      ['以工程規則檢查可達性與布局限制，保留每個候選的節拍估算及假設。', 'Check reachability and layout constraints with engineering rules and keep the assumptions behind each cycle-time estimate.'],
      ['輸出 2D／3D 佈局、物料清單與待現場驗證的風險點。', 'Produce 2D and 3D layouts, a bill of materials, and risks that need on-site validation.'],
    ],
    architecture: [
      [['作業與圖面', 'Operations and CAD'], ['工件、流程、廠房尺寸與限制', 'Payloads, workflows, dimensions, and constraints']],
      [['設計候選', 'Design candidates'], ['機型、夾具、佈局與工作區域', 'Robot, gripper, layout, and workspace options']],
      [['工程檢查', 'Engineering checks'], ['可達性、干涉及節拍估算', 'Reach, clearance, and cycle-time estimates']],
      [['審查與交付', 'Review and delivery'], ['圖面、BOM 及現場驗收項目', 'Drawings, bill of materials, and on-site acceptance items']],
    ],
    uses: [
      ['碼垛站與物料搬運規劃', 'Palletizing and material-handling workcells'],
      ['機器人及夾具方案比較', 'Robot and gripper option comparison'],
      ['廠房圖面到可審查配置的工程流程', 'Engineering workflows from facility drawings to reviewable layouts'],
    ],
    cases: ['industrial-robotics', 'floorplan-automation'],
    evidence: [
      { label: ['操作工作站設計展示', 'Try the robot workcell demonstration'], route: '/labs/demos/robot-workcell/', languageQuery: true, detail: ['以示意工作站檢查工作區域與佈局參數，標明使用的估算假設。', 'Inspect workspace and layout parameters in an illustrative workcell with the estimation assumptions shown.'] },
      { label: ['閱讀九階段工作站設計流程', 'Read the nine-stage workcell workflow'], case: 'industrial-robotics', detail: ['已公開匿名軟體交付案例及歷史工程文件所述的設計流程。', 'The anonymized software delivery describes a historical engineering workflow.'] },
    ],
    deliverables: [
      ['需求、設備參數與場域限制規格', 'Requirements, equipment parameters, and facility constraints'],
      ['可比較的佈局、物料清單及 CAD 檔案', 'Comparable layouts, bill of materials, and CAD files'],
      ['工程假設、風險及現場驗收項目', 'Engineering assumptions, risks, and on-site acceptance items'],
    ],
    engagements: ['architecture-assessment', 'deep-tech-rd'],
    faq: [
      [['能保證現場節拍嗎？', 'Can you guarantee an on-site cycle time?'], ['估算會記錄運動、夾具與作業假設，現場節拍由選定設備和工件的整合驗收確認。', 'Estimates record motion, gripper, and operating assumptions. Final cycle times depend on acceptance testing with actual equipment and workpieces.']],
      [['初談需要原始廠房 CAD 嗎？', 'Do you need the production CAD drawings for the first call?'], ['可先提供去識別化的尺寸、工件範圍和代表性流程，再確認圖面格式與保密需求。', 'Start with anonymized dimensions, workpiece ranges, and representative operations, then agree on drawing formats and confidentiality.']],
    ],
  },
  {
    id: 'scientific-ai',
    service: 'research',
    name: ['科學 AI 與可重現研發', 'Scientific AI & Reproducible R&D'],
    headline: ['讓科學模型的假設、實驗與結果能被重跑', 'Build scientific models your team can rerun'],
    intro: ['與研發團隊建立可稽核的科學運算、時序與訊號模型、文獻查核和可重現實驗流程。', 'We work with R&D teams on auditable scientific computing, time-series and signal models, literature verification, and reproducible experiments.'],
    problems: [
      ['模型只在一組資料或參數上驗證，難以理解它在不同條件的行為。', 'A model tested on one dataset or parameter set leaves its behavior in other conditions unclear.'],
      ['文獻推論的引文與數字未保留上下文，評閱者難以核對。', 'Reviewers cannot audit scientific claims when quotes or numbers lose their source context.'],
      ['實驗環境或資料版本變更時，團隊需要知道哪個變因驅動結果。', 'When environments or data versions change, teams need to know which variable drove the result.'],
    ],
    engineering: [
      ['固定輸入版本、基線、量測定義與失效條件。', 'Pin input versions, baselines, measurement definitions, and failure conditions.'],
      ['執行控制實驗、參數掃描和敏感度分析，檢查資料切分與不確定性。', 'Run controlled experiments, parameter sweeps, and sensitivity analysis while checking data splits and uncertainty.'],
      ['保存模擬、證據來源和可再現的執行設定，將限制寫入驗證報告。', 'Record simulations, evidence sources, and reproducible runs, with limitations in the validation report.'],
    ],
    architecture: [
      [['假設與資料', 'Hypotheses and data'], ['來源卡、版本、標註與規範', 'Source cards, versions, labels, and protocol']],
      [['模型與實驗', 'Models and experiments'], ['基線、掃描、訓練或模擬設定', 'Baseline, sweeps, training, or simulation settings']],
      [['檢查與評估', 'Verification and evaluation'], ['數值守恆、誤差、穩健性或外部驗證', 'Conservation, errors, robustness, or external validation']],
      [['可重現交付', 'Reproducible handover'], ['結果、限制、程式及重跑指令', 'Results, limitations, code, and rerun instructions']],
    ],
    uses: [
      ['訊號與腦波研究驗證流程', 'Signal and EEG research validation'],
      ['光子網路的故障傳播與敏感度模擬', 'Fault propagation and sensitivity simulation for photonic networks'],
      ['有引用稽核的文獻分析與研究自動化', 'Literature analysis and research automation with citation audits'],
    ],
    cases: ['research-automation', 'photonic-computing', 'eeg-treatment-response'],
    evidence: [
      { label: ['調整四級光子網路', 'Adjust the four-stage photonic mesh'], route: '/labs/evidence/photonics/', languageQuery: true, detail: ['比較示意網路的理想與故障輸出，數值來自軟體模擬。', 'Compare ideal and faulted outputs on a reference mesh, using computed software simulation results.'] },
      { label: ['閱讀公開研究與方法', 'Review publications and methods'], route: '/research/', detail: ['論文頁標明期刊、會議或預印本，並可回到原文。', 'Published work distinguishes journals, conferences, and preprints and links to the primary sources.'] },
    ],
    deliverables: [
      ['實驗計畫、資料版本與基線', 'Protocol, data versions, and baselines'],
      ['模擬或模型程式、分析圖與可重跑設定', 'Simulation or modeling code, analysis outputs, and reproducible settings'],
      ['驗證報告、適用範圍與交接文件', 'Validation report, applicability limits, and handover notes'],
    ],
    engagements: ['deep-tech-rd', 'architecture-assessment'],
    faq: [
      [['可直接用在醫療決策嗎？', 'Can research outputs be used for medical decisions?'], ['醫療應用需另行確認目標用途、資料治理、臨床驗證及適用規範。研究成果以發表內容及研究情境解讀。', 'Medical use requires separate scoping of intended use, data governance, clinical validation, and applicable requirements. Research findings are presented within their published scope.']],
      [['可協助建構驗證流程嗎？', 'Can you help design validation before model development?'], ['可以。先定義可接受的偏差、資料切分和重跑方式，再選基線並比較方法。', 'Yes. Define acceptable error, data splits, and reproducibility before selecting baselines and comparing methods.']],
    ],
  },
  {
    id: 'financial-ai',
    service: 'domain-rd',
    name: ['金融 AI 與研究工程', 'Financial AI & Research Engineering'],
    headline: ['讓金融資料、研究假設與回測結果可回查', 'Make financial data, assumptions, and backtests traceable'],
    intro: ['為研究、風控與產品團隊設計可追溯的資料管線、有時間點控制的實驗及可重現的決策支援工具。', 'We design traceable data pipelines, point-in-time experiments, and reproducible decision-support tools for research, risk, and product teams.'],
    problems: [
      ['金融研究整合不同作業日、事件時間和公告時間，容易誤用尚未發生的資訊。', 'Combining market days, event times, and publication dates can inadvertently use information that was not yet available.'],
      ['回測結果會隨手續費、流動性假設、資料版本和基準變動。', 'Backtest outcomes vary with fees, liquidity assumptions, data versions, and reference strategies.'],
      ['研究過程需要保留引用與假設，讓評閱者可重跑及質疑。', 'Research needs traceable sources and assumptions so reviewers can rerun and challenge it.'],
    ],
    engineering: [
      ['建立來源、時間點、修訂與缺失狀態的資料模型。', 'Model provenance, as-of times, revisions, and missingness.'],
      ['定義訓練、驗證與測試時段，對照成本、限制與策略基準。', 'Define train, validation, and test periods and compare costs, constraints, and reference strategies.'],
      ['保存回測設定、結果、失效情境與可重現輸出。', 'Record backtest configuration, results, failure scenarios, and reproducible outputs.'],
    ],
    architecture: [
      [['資料層', 'Data layer'], ['公開或授權資料、事件與日期', 'Public or licensed data, events, and dates']],
      [['研究與假設', 'Research and assumptions'], ['時間點對齊、特徵與成本假設', 'Point-in-time alignment, features, and cost assumptions']],
      [['對照與驗證', 'Comparison and validation'], ['基準、區間外驗證與敏感度', 'Baselines, out-of-sample checks, and sensitivity']],
      [['決策支援', 'Decision support'], ['可複核摘要、限制與人工評閱', 'Reviewable summaries, limitations, and human review']],
    ],
    uses: [
      ['具來源與時間點的投資研究資料管線', 'Research pipelines with evidence and as-of dates'],
      ['模型、回測與敏感度的可重現分析', 'Reproducible model, backtest, and sensitivity analysis'],
      ['需要引用覆核的研究助理', 'Research assistants with citation review'],
    ],
    cases: ['financial-intelligence', 'amm-rebalancing-research'],
    evidence: [
      { label: ['查看 AMM 再平衡公開研究', 'Inspect public AMM rebalancing research'], case: 'amm-rebalancing-research', detail: ['創辦人與研究團隊的學術研究，案例頁說明回測範圍並連至原文。', 'Academic work by the founder and research collaborators, with scope and the original publication linked from the case.'] },
    ],
    deliverables: [
      ['資料規格、來源字典與可重現管線', 'Data specification, source dictionary, and reproducible pipeline'],
      ['模型與評測腳本、成本與假設紀錄', 'Model and evaluation scripts with costs and assumptions documented'],
      ['案例回測報告、審閱流程與技術說明', 'Backtest report, review workflow, and technical notes'],
    ],
    engagements: ['architecture-assessment', 'deep-tech-rd'],
    faq: [
      [['可評估既有回測方法嗎？', 'Can you review an existing backtest?'], ['可以，會從距離部署最近的資料和假設檢查，固定日期、填補方式與估計成本，再設計對照。', 'Yes. We start with the data and assumptions closest to deployment, pin dates, imputation, and cost estimates, then design the comparison.']],
      [['此服務的交付重點是什麼？', 'What does this service deliver?'], ['交付重點是資料、模型、評估及審閱流程，以歷史或研究情境呈現結果。', 'The deliverables are data systems, models, evaluation, and review workflows. Results are presented within their historical or research conditions.']],
    ],
  },
];

export const pricing = {
  label: ['詢問報價', 'Request a quote'],
  note: ['時程是常見合作範圍。正式報價和交付日期會在確認資料、環境和驗收條件後共同議定。', 'Durations show typical engagement ranges. Quotes and delivery dates are agreed after scoping data, environments, and acceptance criteria.'],
};

export const engagements = [
  {
    id: 'architecture-assessment', procurement: 'technical-consulting', service: 'domain-rd',
    name: ['AI 架構評估', 'AI Architecture Assessment'], duration: ['約 1–2 週', 'Typically 1–2 weeks'],
    intro: ['適合已有原型或系統圖、需要決定架構與優先改進項目的團隊。', 'For teams with a prototype or system diagram that need to make architecture and prioritization decisions.'],
    inputs: ['系統概述、關鍵工作負載與已知瓶頸', 'System overview, key workloads, and known bottlenecks'],
    outputs: [
      ['架構審查與瓶頸分析', 'Architecture and bottleneck review'],
      ['風險清單與技術建議', 'Risk register and technical recommendations'],
      ['優先排序與實作路線圖', 'Priorities and implementation roadmap'],
    ],
  },
  {
    id: 'llm-audit', procurement: 'technical-consulting', service: 'agent',
    name: ['LLM 評估與成本審計', 'LLM Evaluation & Cost Audit'], duration: ['約 2–4 週', 'Typically 2–4 weeks'],
    intro: ['適合想把實際品質、可靠性與每項成功任務的成本放在同一份比較的團隊。', 'For teams that want a comparison of observed quality, reliability, and cost per successful task.'],
    inputs: ['代表性任務、模型版本、流程記錄與計價方式', 'Representative tasks, model versions, workflow traces, and pricing assumptions'],
    outputs: [
      ['評測集與品質、可靠性基線', 'Evaluation set and quality and reliability baseline'],
      ['Token、延遲與成本分析', 'Token, latency, and cost analysis'],
      ['工作流程改善與基準報告', 'Workflow recommendations and benchmark report'],
    ],
  },
  {
    id: 'edge-feasibility', procurement: 'feasibility-study', service: 'edge-ai',
    name: ['邊緣 AI 可行性研究', 'Edge AI Feasibility Study'], duration: ['約 3–6 週', 'Typically 3–6 weeks'],
    intro: ['在投入裝置整合前，確認模型轉換、Runtime 相容性和端到端資源限制。', 'Assess model conversion, runtime compatibility, and end-to-end resource limits before device integration.'],
    inputs: ['目標裝置與 SDK、模型版本、授權、代表性輸入及品質門檻', 'Target device and SDK, model version and license, representative inputs, and quality thresholds'],
    outputs: [
      ['硬體相容性及模型資源分析', 'Hardware compatibility and model profiling'],
      ['最佳化建議與部署可行性報告', 'Optimization recommendations and deployment feasibility report'],
      ['裝置基準測試計畫', 'Target-device benchmark plan'],
    ],
  },
  {
    id: 'agent-poc', procurement: 'engineering-delivery', service: 'agent',
    name: ['客製 AI Agent 概念驗證', 'Custom AI Agent PoC'], duration: ['約 4–8 週', 'Typically 4–8 weeks'],
    intro: ['以一個有清楚邊界的工作流程驗證 Agent 的完成率、權限與失敗處理。', 'Test completion, permissions, and failure handling in one clearly scoped agent workflow.'],
    inputs: ['流程樣本、使用者角色、資料治理規則及驗收案例', 'Workflow samples, user roles, data governance rules, and acceptance cases'],
    outputs: [
      ['可執行原型與評估流程', 'Working prototype and evaluation pipeline'],
      ['失敗處理與人工覆核', 'Failure handling and human review'],
      ['技術文件與正式環境路線圖', 'Technical documentation and production roadmap'],
    ],
  },
  {
    id: 'gpu-poc', procurement: 'engineering-delivery', service: 'gpu-infrastructure',
    name: ['GPU 基礎設施概念驗證', 'GPU Infrastructure PoC'], duration: ['約 4–8 週', 'Typically 4–8 weeks'],
    intro: ['用代表性工作負載驗證共用運算環境的資源配置、監控與排程。', 'Validate resource allocation, monitoring, and scheduling in a compute environment with representative workloads.'],
    inputs: ['裝置與環境、任務大小、等待限制及既有基準', 'Devices and environment, workload sizes, wait limits, and existing baselines'],
    outputs: [
      ['工作負載分析與部署架構', 'Workload profile and deployment architecture'],
      ['排程原型與資源監控', 'Scheduling prototype and resource monitoring'],
      ['效能與運維條件評估', 'Performance evaluation and operating constraints'],
    ],
  },
  {
    id: 'deep-tech-rd', procurement: 'custom-rd', service: 'domain-rd',
    name: ['客製深科技研發', 'Custom Deep-Tech R&D'], duration: ['依研究範圍安排', 'Scope-based engagement'],
    intro: ['為科學模型、機器人最佳化、訊號分析或運算問題分段設計、實驗與交付。', 'Scope staged design, experiments, and delivery for scientific modeling, robotics, signals, or compute problems.'],
    inputs: ['研究問題、可用資料、智慧財產範圍及技術約束', 'Research question, available data, IP scope, and technical constraints'],
    outputs: [
      ['研究計畫、基線及明確驗收條件', 'Research plan, baseline, and acceptance criteria'],
      ['可重現實驗與工程原型', 'Reproducible experiments and engineering prototype'],
      ['量測佐證與交接文件', 'Measurement evidence and handover documentation'],
    ],
  },
  {
    id: 'fractional-cto', procurement: 'fractional-cto', service: 'domain-rd',
    name: ['兼任技術長', 'Fractional CTO'], duration: ['持續型技術領導', 'Ongoing technical leadership'],
    intro: ['需長期架構治理、技術決策或研發協調時，與團隊定期檢視優先順序。', 'For teams that need recurring architecture governance, technical decisions, or R&D coordination.'],
    inputs: ['團隊現況、產品目標、決策權責與檢視頻率', 'Team context, product goals, decision responsibilities, and review cadence'],
    outputs: [
      ['架構決策紀錄與技術路線圖', 'Architecture decisions and a technical roadmap'],
      ['風險與實作順序的定期檢視', 'Regular risk and implementation reviews'],
      ['交付品質、驗收與團隊協作建議', 'Guidance on delivery quality, acceptance, and team coordination'],
    ],
  },
];

export const procurement = [
  {
    id: 'technical-consulting', name: ['技術顧問', 'Technical Consulting'],
    intro: ['當團隊已經有系統或模型，需要獨立判斷限制、風險與下一步投入，用技術審查或 LLM 稽核把不確定性轉成可執行選項。', 'When a model or system already exists, an architecture review or LLM audit turns constraints, risks, and investment choices into actionable options.'],
    acceptance: ['共用評分方式、可查核的問題清單，以及可用於技術決策的優先排序。', 'A shared evaluation method, an auditable findings list, and a ranked set of technical decisions.'],
  },
  {
    id: 'feasibility-study', name: ['可行性研究', 'Feasibility Study'],
    intro: ['先在代表性輸入、模型與裝置上評估高風險假設，交付下一階段的可行路線及驗收方法。', 'Test the highest-risk assumptions against representative inputs, models, and devices, then define viable paths and evaluation methods for the next stage.'],
    acceptance: ['明確指出可行路徑、需要補驗證的環節與停止條件。', 'Identify viable paths, what still needs validation, and criteria for stopping.'],
  },
  {
    id: 'custom-rd', name: ['客製研發', 'Custom R&D'],
    intro: ['對尚無成熟產品可直接滿足的科學與工程問題，先建立可重現基線，再依實驗結果調整設計。', 'For scientific and engineering problems without an off-the-shelf fit, establish a reproducible baseline and refine the design through experiments.'],
    acceptance: ['提供可重跑的實驗、適用範圍、限制與下一階段的工程選擇。', 'Provide rerunnable experiments, applicability and limitations, and engineering choices for the next stage.'],
  },
  {
    id: 'engineering-delivery', name: ['工程交付', 'Engineering Delivery'],
    intro: ['從原型到導入，以指定環境、使用流程和驗收條件為準，依範圍交付可運行、可維護的系統與文件。', 'From prototype to integration, deliver runnable, maintainable software and documentation against the agreed environment, workflow, and acceptance criteria.'],
    acceptance: ['在代表性環境展示工作流程，交付評測、運作及故障處理文件。', 'Demonstrate the workflow in a representative environment and deliver evaluation, operations, and recovery documentation.'],
  },
  {
    id: 'fractional-cto', name: ['兼任技術長', 'Fractional CTO'],
    intro: ['協助產品與研發團隊把技術方向、架構決策與工程品質納入長期產品節奏。', 'Help product and R&D teams make technical direction, architecture decisions, and engineering quality part of an ongoing product cadence.'],
    acceptance: ['以已記錄的決策、清晰的責任範圍及定期技術檢視評估合作進度。', 'Track engagement progress with documented decisions, clear responsibilities, and regular technical reviews.'],
  },
];

export const founder = {
  name: ['陳麒升', 'Chi-Sheng (Michael) Chen'],
  profiles: [
    { label: ['個人學術網站', 'Personal academic site'], href: 'https://chishengchen.github.io/' },
    { label: ['Google Scholar', 'Google Scholar'], href: 'https://scholar.google.com/citations?user=5XHD7nkAAAAJ' },
    { label: ['GitHub', 'GitHub'], href: 'https://github.com/ChiShengChen' },
    { label: ['ORCID', 'ORCID'], href: 'https://orcid.org/0000-0003-0807-0217' },
  ],
  professional: ['公開專業經歷包含數位 IC 研發工程、AI 新創共同創辦與工程領導，以及應用 AI 系統開發。', 'His public professional record includes digital IC R&D, AI startup co-founding and engineering leadership, and applied AI system development.'],
  research: ['研究涵蓋生醫資訊學、腦波與生理時序、科學機器學習及量子機器學習。研究與出版由作者及研究團隊各自署名。', 'His research covers biomedical informatics, EEG and physiological time series, scientific machine learning, and quantum machine learning. Publications retain their author and research-team attribution.'],
  openSource: ['公開程式包含可重現的引文核對、LLM 輸出檢查與模型用量評估，可直接查閱原始碼和測試方法。', 'Public code covers reproducible citation verification, checks for LLM outputs, and model usage evaluation with inspectable test methods.'],
  award: ['創辦人參與的 MadGAA Lab 在 Berkeley RDI AgentX–AgentBeats 第一階段 Healthcare Agent 類別獲第 3 名。', 'MadGAA Lab, a team the founder participated in, placed third in the Phase 1 Healthcare Agent category of Berkeley RDI’s AgentX–AgentBeats.'],
  awardSource: 'https://rdi.berkeley.edu/agentx-agentbeats.html',
};

export const publicationGroups = [
  {
    id: 'scientific-simulation', title: ['科學模擬與量子機器學習', 'Scientific Simulation & Quantum ML'],
    papers: [
      { title: 'Unraveling quantum environments: Transformer-assisted learning in Lindblad dynamics', venue: 'Physical Review A · 2025', href: 'https://journals.aps.org/pra/abstract/10.1103/gsxk-45mk', detail: ['以 Transformer 學習開放量子系統的環境動力學。', 'Transformer-assisted learning of environment dynamics in open quantum systems.'] },
      { title: 'Quantum Adaptive Self-Attention for Quantum Transformer Models', venue: 'Quantum Science and Technology · 2026', href: 'https://doi.org/10.1088/2058-9565/ae8b21', code: 'https://github.com/ChiShengChen/QASA', detail: ['在量子 Transformer 中研究自適應自注意力。', 'Research on adaptive self-attention in quantum transformer models.'] },
      { title: 'Quantum-Enhanced Channel Mixing in RWKV Models for Time Series Forecasting', venue: 'arXiv preprint · 2025', href: 'https://arxiv.org/abs/2505.13524', code: 'https://github.com/ChiShengChen/QuantumRWKV', detail: ['比較混合量子及經典架構的時序預測表現。', 'Compares hybrid quantum and classical approaches to time-series forecasting.'] },
      { title: 'Quantum Adaptive Self-Attention for Financial Rebalancing: An Empirical Study on Automated Market Makers in Decentralized Finance', venue: 'IEEE ICASSP · 2026', href: 'https://www.cmsworkshops.com/ICASSP2026/view_paper.php?PaperNum=14673&bare=1', preprint: 'https://arxiv.org/abs/2509.16955', detail: ['AMM 再平衡的實驗設計與對照，結果適用於論文設定。', 'An experimental comparison of AMM rebalancing methods under the paper’s stated conditions.'] },
    ],
  },
  {
    id: 'vision', title: ['生成式模型與電腦視覺', 'Generative Models & Computer Vision'],
    papers: [
      { title: 'Exploring the Potential of Electroencephalography Signal-Based Image Generation Using Diffusion Models: Integrative Framework Combining Mixed Methods and Multimodal Analysis', venue: 'JMIR Medical Informatics · 2025', href: 'https://medinform.jmir.org/2025/1/e72027', detail: ['以擴散模型研究腦波訊號與視覺語意。', 'Examines EEG signals and visual semantics using diffusion models.'] },
      { title: 'Improving fine-grained food classification using deep residual learning and selective state space models', venue: 'PLOS ONE · 2025', href: 'https://doi.org/10.1371/journal.pone.0322695', code: 'https://github.com/ChiShengChen/ResVMamba', detail: ['在細粒度食物影像上評估殘差式狀態空間模型。', 'Evaluates residual state-space models for fine-grained food classification.'] },
      { title: 'Measuring Browser Webcam Gaze Honestly: A Capture-Clock Methodology and Open Reference Implementation', venue: 'MICCAI DEMI workshop · 2026', href: 'https://arxiv.org/abs/2608.11566', code: 'https://github.com/ChiShengChen/webcam_gaze_webapp', detail: ['提供瀏覽器視線追蹤的影格量測方法與開放參考實作。', 'A browser gaze measurement method based on capture timing, with an open reference implementation.'] },
    ],
  },
  {
    id: 'signals', title: ['生理訊號與時序建模', 'Physiological Signals & Time Series'],
    papers: [
      { title: 'Prediction of antidepressant responses to non-invasive brain stimulation using frontal electroencephalogram signals: Cross-dataset comparisons and validation', venue: 'Journal of Affective Disorders · 2023', href: 'https://pubmed.ncbi.nlm.nih.gov/37579885/', detail: ['用額葉腦波進行非侵入性腦刺激治療反應的學術研究。', 'Academic research into frontal EEG signals and response to non-invasive brain stimulation.'] },
      { title: 'Large Cognition Model: Towards Pretrained EEG Foundation Model', venue: 'arXiv preprint · 2025', href: 'https://arxiv.org/abs/2502.17464', code: 'https://github.com/ChiShengChen/LCMv1', detail: ['研究跨資料來源與電極配置的腦波預訓練模型。', 'Studies pretrained EEG representations across datasets and electrode configurations.'] },
      { title: 'FreqLens: Interpretable Frequency Attribution for Time Series Forecasting', venue: 'arXiv preprint · 2026', href: 'https://arxiv.org/abs/2602.08768', code: 'https://github.com/ChiShengChen/FreqLens', detail: ['以頻域歸因解析時序模型對不同頻率的依賴。', 'Uses frequency attribution to inspect how time-series models depend on frequency components.'] },
    ],
  },
];

export const insights = [
  {
    id: 'model-to-device', name: ['把生成式影像送上裝置之前', 'Before Moving Generative Vision onto a Device'],
    intro: ['先準備可比較的端到端基準，再針對最慢的階段做轉換和最佳化。', 'Prepare a comparable end-to-end baseline before optimizing the slowest stage.'],
    points: [
      ['固定模型版本、輸入尺寸、Batch、暖機方式和驗收用的影像。先分開記錄解碼、前處理、推論、後處理與資料搬移。', 'Pin model version, input dimensions, batch, warmup protocol, and acceptance images. Time decoding, preprocessing, inference, postprocessing, and data transfer separately.'],
      ['轉換時檢查算子及精度支援。每次改動都用同一驗收集比較遮罩邊界、顏色及有影片時的跨幀一致性。', 'Check supported operators and precision during conversion. Compare mask boundaries, color, and temporal consistency on the same examples after each change.'],
      ['最後在實際裝置紀錄端到端延遲、記憶體峰值與持續執行。在其他設備上跑到的推論時間僅代表該後端與測試條件。', 'On the device, record end-to-end latency, peak memory, and sustained behavior. Inference times on another device describe only that backend and test condition.'],
    ],
    solution: 'semiconductor-edge-ai', route: '/labs/evidence/vision/',
  },
  {
    id: 'successful-task', name: ['用每項成功任務的成本評估 Agent', 'Evaluate Agents by Cost per Successful Task'],
    intro: ['將完成率、證據、復原、覆核和成本放在同一份測試，才看得出架構取捨。', 'Put completion, evidence, recovery, review, and cost in the same evaluation to expose architecture trade-offs.'],
    points: [
      ['先用合成及真實可用任務定義硬性約束和評分方式，再將題目分成常態、邊界與負向控制。', 'Use synthetic and approved representative tasks to define constraints and scoring. Include routine tasks, boundary cases, and negative controls.'],
      ['固定計價假設，記錄模型呼叫、重試和必要人工處理。在零成功的區間分開呈現總成本及失敗率。', 'Pin pricing assumptions and record model calls, retries, and required human handling. Report total cost and failure rate separately when no task succeeds.'],
      ['比較策略時列出完成率與驗證涵蓋率。效能報告應標明哪些計數來自實測、重播、模擬或估算。', 'Show completion and verification coverage when comparing policies. Label counts as measured, replayed, simulated, or estimated.'],
    ],
    solution: 'ai-reliability', route: '/labs/demos/reliability/',
  },
  {
    id: 'gpu-waits', name: ['用工作軌跡定位 GPU 等待原因', 'Find GPU Waiting Causes in Job Traces'],
    intro: ['利用率、等待時間和資源保留要對照實際作業生命週期解讀。', 'Interpret utilization, waiting, and reservations against the job lifecycle.'],
    points: [
      ['最小的可用紀錄包含提交、等待、開始、完成、退出原因、裝置及抽樣記憶體。記錄樣本間隔，避免以缺少樣本推斷裝置沒有使用。', 'A useful trace captures submission, waiting, start, completion, exit reason, device, and sampled memory. Record the sampling interval so missing samples are not mistaken for idle time.'],
      ['固定使用者工作負載和裝置上限，對照原始策略與候選版本。每個策略的工作混合、到達時間與停止條件應一致。', 'Compare the default and candidate policies under the same workload and device caps. Keep the job mix, arrivals, and stop criteria consistent.'],
      ['解讀時拆開資源准入、等待與實際運算。單一裝置的控制實驗可以示範量測方式，多機容量需另行實測。', 'Separate admission, waiting, and execution in the analysis. A single-device controlled run can demonstrate measurement, while multi-host sizing needs its own tests.'],
    ],
    solution: 'gpu-infrastructure', route: '/labs/evidence/gpu/',
  },
];

export const offeringRoutes = [
  '/solutions/',
  ...solutions.map(item => `/solutions/${item.id}/`),
  '/services/',
  ...procurement.map(item => `/services/${item.id}/`),
  '/company/', '/research/', '/insights/', '/capabilities/',
];
