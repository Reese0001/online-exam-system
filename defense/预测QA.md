# 在线考试系统答辩预测 Q&A（20 题）

> 共 20 题，分 6 类，每题含问题、参考答案（基于实际代码与设计）、回答要点提示
> 答辩前务必阅读核心代码，确认能回答每个问题

---

## 一、技术选型类（5 题）

### Q1. 为什么选择 React 而不是 Vue？

**参考答案**：
选择 React 主要基于三点考虑。第一，React 的组件化和 Hooks 机制非常适合中后台管理系统与答题场景，useEffect、useState 等 Hooks 使函数组件具备状态与副作用管理能力，替代了类组件的生命周期心智负担。第二，React 生态成熟，React Router 6 是事实标准的路由库，Ant Design 5 是企业级组件库，与 React 深度集成，开箱即用。第三，React 18 引入了并发渲染特性，支持自动批处理和过渡更新，对考试答题这种频繁状态更新场景有性能优势。Vue 虽然也优秀，但 Ant Design 官方主推 React 版本，且 React 在中后台管理领域应用更广泛，社区资源更丰富。

**回答要点**：组件化 + 生态成熟（Ant Design）+ React 18 并发渲染特性

---

### Q2. 为什么选择 Node.js 而不是 Java/Python？

**参考答案**：
选择 Node.js 有三个原因。第一，Node.js 采用事件驱动、非阻塞 I/O 模型，非常适合考试并发答题与答案暂存这种 I/O 密集型场景，100 人并发下性能表现优异。第二，前后端同语言（JavaScript），降低了全栈开发的心智成本与上下文切换开销，前端开发者可以直接写后端，提升开发效率。第三，Node.js 18 LTS 稳定可靠，Express 框架轻量灵活，中间件生态丰富，学习曲线平缓，适合毕设规模。Java 虽然企业级成熟但对毕设过重，Spring Boot 启动慢；Python 的 Django/Flask 也可选但异步生态不如 Node.js 成熟。对于 100 人并发的毕设系统，Node.js 在开发效率与性能之间取得了最佳平衡。

**回答要点**：非阻塞 I/O 契合并发场景 + 前后端同语言降低成本 + Express 轻量适合毕设

---

### Q3. 为什么用 Sequelize 而不是原生 SQL？

**参考答案**：
使用 Sequelize ORM 有四个优势。第一，参数化查询从机制上防御 SQL 注入，无需手动处理参数转义，安全性有保障。第二，通过模型定义表达实体间的关联关系（一对多、多对多），代码可读性高，例如 Paper 与 Question 的多对多关系通过 PaperQuestion 中间表关联，Sequelize 的 include 语法可以方便地联表查询。第三，提供事务管理保证组卷、交卷、阅卷等复合操作的原子性，任一步骤失败可回滚。第四，Scope 机制控制字段暴露，User 模型的 defaultScope 排除 password_hash 字段，从模型层保障敏感数据最小暴露。原生 SQL 虽然灵活但容易引入 SQL 注入风险，且代码可维护性差。

**回答要点**：防 SQL 注入 + 模型关联可读性 + 事务原子性 + Scope 敏感数据保护

---

### Q4. 为什么用 Zustand 而不是 Redux？

**参考答案**：
选择 Zustand 而不是 Redux 主要基于三点。第一，Zustand 轻量无样板代码，API 极其简洁，通过 create 函数创建 store，组件用 hook 直接订阅更新，而 Redux 需要定义 action、reducer、connect 或 useSelector/useDispatch，样板代码多。第二，Zustand 支持在 store 外部通过 useExamStore.getState() 获取最新状态，这个特性在考试倒计时定时器和 visibilitychange 事件监听器等非组件上下文中访问与更新状态非常重要，Redux 在非组件上下文需要手动 dispatch 较繁琐。第三，Zustand 对 TypeScript 友好，且对毕设规模的中等复杂度应用足够。Redux Toolkit 虽然简化了 Redux，但 DevTools 和生态对毕设并非必需，Zustand 在开发效率上更优。

**回答要点**：轻量无样板 + getState() 非组件上下文访问 + TS 友好 + 毕设规模足够

---

### Q5. 前后端分离的优势是什么？

**参考答案**：
前后端分离有三个核心优势。第一，前后端可独立开发、独立部署、独立演进，前端 React SPA 独立构建，后端 Express 提供纯 API 服务，通过 OpenAPI 接口契约实现解耦协作，提升开发效率。第二，后端只提供 RESTful API，不关心页面渲染，职责单一，便于后续对接移动端或其他客户端。第三，前端通过 Axios 拦截器统一处理 JWT 注入与错误码，后端通过中间件链统一处理认证、权限、校验，关注点分离清晰。本系统前端通过 Vite 构建为静态资源，可由 Nginx 托管或后端托管，部署灵活。相比传统的 SSR（如 JSP、Thymeleaf），前后端分离更符合现代 Web 开发趋势，也便于二次开发。

**回答要点**：独立开发部署 + 接口契约解耦 + 职责单一 + 便于扩展多端

---

## 二、架构设计类（4 题）

### Q6. 系统的分层架构是怎样的？

**参考答案**：
系统后端采用 routes → controllers → services → models 四层分层架构。routes 层声明路径与中间件组合，例如 router.post('/api/users', auth(), requireRole('admin'), userController.create)；controllers 层负责 HTTP 请求参数提取与响应编排，不包含业务逻辑；services 层负责业务逻辑实现，如 authService 的登录、paperService 的随机组卷；models 层封装 Sequelize 数据访问。各层职责清晰、单向依赖，上层依赖下层，不可反向。这种分层满足 NFR-18 可维护性需求，便于独立测试——服务层可 Mock 模型层做单元测试，控制器层可 Mock 服务层做集成测试。此外还有 middlewares 层（auth、rbac、errorHandler、logger）处理横切关注点，config 层管理配置，utils 层提供工具函数。

**回答要点**：四层职责清晰 + 单向依赖 + 便于独立测试 + 横切关注点中间件

---

### Q7. 如何实现 RBAC 权限控制？

**参考答案**：
RBAC 权限控制通过 rbac.js 中间件实现。系统定义 admin、teacher、student 三种角色，requireRole 函数接收允许的角色列表，从 JWT 解析出的 req.user.role 校验是否匹配，不匹配返回 403 无权限。代码实现是：if (!roles.includes(req.user.role)) return fail(res, FORBIDDEN, '无权限访问该资源', null, 403)。同时提供 requireAdmin、requireTeacher、requireStudent 单角色快捷方法，以及 requireAdminOrTeacher、requireTeacherOrStudent 多角色快捷方法。路由层通过组合 auth 与 requireRole 中间件实现接口级鉴权，例如创建用户接口限定仅管理员：router.post('/api/users', auth(), requireRole('admin'), userController.create)。前端通过 ProtectedRoute 组件实现路由级鉴权，根据用户角色重定向到对应页面。RBAC 中间件测试有 8 个用例，覆盖角色匹配、不匹配、多角色等场景，100% 通过。

**回答要点**：requireRole 中间件 + JWT 解析 role + 路由组合鉴权 + 前端 ProtectedRoute

---

### Q8. JWT 认证流程是怎样的？

**参考答案**：
JWT 认证流程分五步。第一步，用户提交账号密码至 POST /api/auth/login。第二步，后端 authService 查询 users 表（通过 User.scope('withPassword') 显式引入密码哈希），用 bcrypt.compare 校验密码哈希，校验账号状态为 active。第三步，校验通过后用 jwt.sign 签发 JWT，Payload 含 userId、role、iat、exp，有效期 2 小时，返回 token 与 userInfo（toUserInfo 剔除 password_hash）。第四步，前端将 JWT 存于 localStorage，Axios 请求拦截器自动注入 Authorization: Bearer 头。第五步，后端 auth 中间件解析 JWT，jwt.verify 校验签名与有效期，成功将 payload 挂载到 req.user，失败返回 401（区分 TokenExpiredError 令牌已过期与无效令牌）。JWT 的无状态特性契合前后端分离架构，服务端无需维护会话，令牌自包含身份信息。认证中间件有 7 个测试用例覆盖有效、缺失、无效、过期 token 等场景。

**回答要点**：登录签发 + bcrypt 校验 + Axios 注入 + 中间件校验 + 无状态特性

---

### Q9. 如何防止 SQL 注入和 XSS 攻击？

**参考答案**：
SQL 注入防护：全部数据库操作通过 Sequelize ORM 参数化查询，禁止 SQL 字符串拼接，从机制上防御 SQL 注入。例如查询用 where 对象而非字符串拼接：Question.findAll({ where: { type, difficulty } })。原生查询使用 replacements 参数绑定。XSS 防护：后端对用户输入进行 HTML 转义后存储，前端 React 默认转义 JSX 插值（{variable} 自动转义），富文本内容采用白名单过滤，设置 X-Content-Type-Options: nosniff 响应头防止 MIME 类型嗅探。此外还有其他安全措施：bcrypt 加盐哈希存储密码（saltRounds=10）抗彩虹表；登录接口限流（express-rate-limit，5 次/分钟）防御暴力破解；敏感数据接口严格鉴权，学生阅卷完成前不可获取标准答案；CORS 仅允许前端部署域名。这些安全措施在测试报告中均有对应测试用例验证。

**回答要点**：ORM 参数化查询防注入 + React JSX 转义防 XSS + bcrypt + 限流 + CORS

---

## 三、功能实现类（6 题）

### Q10. 随机组卷算法是如何实现的？

**参考答案**：
随机组卷由 paperService.js 的 autoGenerate 函数实现。算法流程：首先开启数据库事务，然后遍历教师设定的每条组卷规则（规则包含题型 type、知识点 knowledge_point、难度 difficulty、数量 count、分值 score）。对每条规则，按条件筛选候选题目 candidates = await Question.findAll({ where })，校验候选数量是否充足，不足则抛出 BizError 提示"题型 X 满足条件的题目不足，需要 N 题，实际仅 M 题"。充足则通过 candidates.sort(() => Math.random() - 0.5) 随机排序，用 slice(0, rule.count) 截取所需数量，累加总分并写入 allPQ 数组。所有规则处理完后，创建 Paper 记录并批量创建 PaperQuestion 关联记录，最后提交事务。任一规则失败则回滚事务，保证组卷原子性。该算法支持多条规则组合，满足差异化命题需求，测试用例 TC-SVC-PAPER-008 覆盖了正常组卷与题库不足异常两种场景。

**回答要点**：事务保证原子性 + 规则遍历筛选 + 题库不足校验 + Math.random 随机排序

---

### Q11. 防作弊机制具体如何工作？

**参考答案**：
防作弊机制在前端 ExamPage.jsx 中实现，包含三个层面。第一是切屏检测：通过 document.addEventListener('visibilitychange', handleVisibilityChange) 监听页面可见性变化，当 document.hidden 为 true 时调用 addSwitchCount 递增切屏计数，当计数超过 ANTI_CHEAT_CONFIG.MAX_SWITCH_COUNT 阈值时，弹窗警告"您已切屏 N 次，超过限制，系统将自动交卷"，并在 AUTO_SUBMIT_ON_EXCEED 配置为 true 时延迟 2 秒自动调用 handleSubmit(true) 强制交卷。第二是禁止复制粘贴：通过拦截 copy、paste、cut、contextmenu 事件，preventDefault 阻止默认行为。第三是离开提示：通过 beforeunload 事件在学生尝试离开页面前弹出浏览器确认提示。这些机制在前端通过 examStore 管理切屏计数，测试用例 TC-STORE-EXAM 覆盖了切屏计数与防作弊逻辑。

**回答要点**：visibilitychange 切屏检测 + 超阈值自动交卷 + 拦截复制粘贴 + beforeunload 离开提示

---

### Q12. 客观题自动阅卷的判断逻辑？

**参考答案**：
客观题自动阅卷由 gradeService.js 的 autoGradeRecord 函数在交卷时触发。首先查询考试记录、试卷题目关联（PaperQuestion）和答题记录（Answer），构建题目映射 pqMap。然后遍历每条答题记录，判断题型是否属于 OBJECTIVE_TYPES（single、multiple、judge、fill）。如果是客观题，调用 compareAnswer 函数比对答案，该函数按题型采用不同策略：单选和判断题完全匹配（student_answer === question.answer）；多选题集合相等比较，将学生答案与标准答案按逗号分割成数组后排序比较，忽略选项顺序；填空题支持多空匹配，以 "||" 分隔多个空的答案，去空格后逐空比较。比对结果 isCorrect 为 true 得满分，false 得 0 分。在事务中更新 answers 表的 score、is_correct、graded_by（NULL 表示系统自动）、graded_at 字段。如果试卷包含主观题（SUBJECTIVE_TYPES 含 short），则生成阅卷任务待教师手动处理。测试用例 TC-SVC-GRADE-002 覆盖了自动阅卷与主观题任务生成。

**回答要点**：compareAnswer 题型差异化 + 完全匹配/集合相等/多空去空格 + 事务更新 + 主观题生成任务

---

### Q13. 如何实现答案暂存和断网续答？

**参考答案**：
答案暂存与断网续答通过前端 examStore.js（Zustand）实现。暂存机制：setAnswer 函数在更新状态的同时，将答案写入 localStorage，key 为 EXAM_DRAFT + examId，value 为 JSON.stringify(newAnswers)。同步机制分两层：第一层是定时同步，通过 setInterval 每 30 秒将暂存答案批量 POST 到服务端 saveAnswer 接口；第二层是即时同步，作答时通过节流函数（2 秒间隔）即时同步到服务端，避免频繁请求。网络失败时静默重试，不弹出错误干扰学生答题。断网续答：initExam 函数在初始化考试时，从 localStorage 读取 EXAM_DRAFT + examId 的暂存答案，JSON.parse 后恢复到 answers 状态，学生重新连接后可以继续答题，已答内容不丢失。服务端 saveAnswer 接口采用 upsert 语义，根据 exam_record_id 和 question_id 更新或插入答题记录。该功能满足 NFR-13 断网续答需求，测试用例 TC-STORE-EXAM 覆盖了暂存与恢复逻辑。

**回答要点**：localStorage 暂存 + 定时 30 秒同步 + 节流即时同步 + initExam 恢复 + upsert 语义

---

### Q14. 考试计时如何实现？时间到如何自动交卷？

**参考答案**：
考试计时在前端通过 ExamTimer 组件与 examStore 实现。计时机制：examStore 维护 remainSeconds 剩余秒数，通过 setInterval 每秒调用 tick 函数递减 remainSeconds。ExamTimer 组件根据 remainSeconds 渲染倒计时显示，格式化函数支持 mm:ss（小于 1 小时）和 HH:mm:ss（大于 1 小时）两种格式。样式切换：剩余 5 分钟时切换黄色警告样式，剩余 1 分钟切换红色危险样式，时间为 0 时显示 00:00。自动交卷：当 remainSeconds 递减到 0 时，自动调用交卷接口 handleSubmit，触发交卷流程。交卷时如果存在未答题目，弹出 Ant Design Modal 确认对话框二次确认，避免误交。倒计时与自动交卷满足 NFR-14 需求，测试用例 TC-COMP-TIMER-001 至 004 覆盖了倒计时显示格式、警告样式、危险样式、时间为 0 显示 00:00 等场景，TC-PAGE-EXAM 覆盖了答题页核心交互。

**回答要点**：setInterval 每秒递减 + 5 分钟警告/1 分钟危险 + 时间为 0 自动交卷 + 未答题确认

---

### Q15. 成绩分布统计如何实现可视化？

**参考答案**：
成绩分布统计由 scoreService.js 的 getStatistics 函数实现后端计算，前端 ScoreStatistics.jsx 实现可视化。后端计算：查询指定考试所有 status 为 graded 的考试记录，提取 total_score 数组，计算五项分析指标——最高分 Math.max、最低分 Math.min、平均分 reduce 求和除以数量、及格率（以试卷及格线为阈值统计达标比例，保留两位小数）、标准差（方差开方，反映成绩离散程度）。按 0-59、60-69、70-79、80-89、90-100 五个分数段统计人数分布，返回 distribution 数组。前端可视化：使用 ECharts 渲染分布柱状图（横轴分数段，纵轴人数）和饼图（各分数段占比），结合 Ant Design 的 Statistic 组件展示最高分、最低分、平均分、及格率、标准差等指标卡片，Table 组件展示班级成绩明细表。支持按考试与班级筛选，以及成绩单 Excel 导出（exceljs 生成 xlsx）。测试用例 TC-SVC-SCORE-003 覆盖了分布统计与指标计算。

**回答要点**：后端 5 指标计算 + 5 分数段分布 + ECharts 柱状图饼图 + Statistic 指标卡片

---

## 四、数据库设计类（2 题）

### Q16. 数据库有多少个表？核心表之间的关系？

**参考答案**：
数据库共 12 张表，10 个核心实体表加 SysConfig 系统配置表和 PaperQuestion、ExamClass 两个中间表。核心表包括：users（用户表）、classes（班级表）、questions（题目表）、papers（试卷表）、paper_questions（试卷题目关联表）、exams（考试表）、exam_classes（考试班级关联表）、exam_records（考试记录表）、answers（答题记录表）、grade_tasks（阅卷任务表）。核心关系有 16 个一对多和 2 个多对多：班级 1 对多学生（class_id 外键）；教师 1 对多题目/试卷/考试（creator_id）；试卷与题目多对多，通过 paper_questions 中间表关联，含 score 分值与 sort_order 排序；考试与班级多对多，通过 exam_classes 中间表关联指定参考范围；考试 1 对多考试记录，考试记录 1 对多答题记录；考试 1 对多阅卷任务。索引策略上，exam_records(exam_id, student_id) 联合唯一索引防重复答卷，answers(exam_record_id, question_id) 联合唯一索引防重复作答。核心业务表采用 deleted_at 软删除避免引用断裂。

**回答要点**：12 张表 + 2 个多对多中间表 + 联合唯一索引防重复 + 软删除

---

### Q17. 如何处理多对多关系（如试卷-题目、考试-班级）？

**参考答案**：
系统通过中间关联表处理多对多关系。试卷与题目的多对多：通过 paper_questions 中间表，包含 paper_id、question_id 外键，以及 score（该题在试卷中的分值）和 sort_order（题目顺序）两个业务字段。这样设计是因为同一道题目在不同试卷中可能有不同分值和顺序，关联表承载这些业务属性。Sequelize 中通过 Paper.belongsToMany(Question, { through: PaperQuestion }) 和 Question.belongsToMany(Paper, { through: PaperQuestion }) 定义关联，查询时用 include 联表获取。考试与班级的多对多：通过 exam_classes 中间表，包含 exam_id、class_id 外键，用于指定某场考试的参考班级范围。创建考试时，教师选择参考班级，系统批量写入 exam_classes 记录；学生进入考试时，校验其所属班级是否在 exam_classes 中，不在则拒绝进入。这种中间表设计是关系型数据库处理多对多的标准方案，保证了数据规范化与查询效率。

**回答要点**：中间表 + 业务字段（分值/顺序）+ Sequelize belongsToMany + 进入考试校验班级

---

## 五、测试与质量类（2 题）

### Q18. 测试覆盖率是多少？如何提高？

**参考答案**：
当前测试覆盖率：后端语句覆盖率 53.64%，分支覆盖率 59.56%，但核心模块覆盖率较高——中间件 auth.js 和 rbac.js 达到 100%，模型 User/Question/Exam 达到 100%，核心服务 authService 98.11%、questionService 95.58%、paperService 90.38%、scoreService 93.58%，核心服务层覆盖率超过 90%。整体覆盖率被 controllers 层（0%，因集成测试 mock 了 service 层，controller 逻辑通过集成测试间接验证）和未单独测试的辅助模块拉低。前端已运行部分 ExamTimer 和 ProtectedRoute 组件 100% 覆盖，authStore 93.33%、examStore 96.55%。提高覆盖率的措施：第一，为 controllers 层编写直接单元测试，或调整集成测试不 mock service 层；第二，配置完整的 Ant Design 测试环境（如 @ant-design/testing-utils），使 QuestionDisplay、ProtectedRoute、Login 三个受 jsdom 环境限制的测试套件能完整运行；第三，补充 examService 和 gradeService 的异常分支测试，这两个服务覆盖率相对较低。

**回答要点**：核心服务层 > 90% + controllers 间接覆盖 + 三项改进措施

---

### Q19. 如何保证 API 接口的正确性？

**参考答案**：
通过三层测试保证 API 接口正确性。第一层是服务层单元测试，Mock 模型层验证业务逻辑，如 authService 登录成功与失败、paperService 随机组卷与题库不足异常、gradeService 自动阅卷与主观题任务生成，共 121 个用例覆盖全部服务逻辑。第二层是中间件单元测试，验证 JWT 认证（有效/缺失/无效/过期 token）和 RBAC 权限（角色匹配/不匹配/多角色），共 15 个用例。第三层是集成测试，通过 Supertest 发起真实 HTTP 请求验证端到端行为，覆盖认证、题库、试卷、考试、成绩五大流程，共 57 个用例，包括完整 CRUD 流程、权限控制、错误码返回、409 冲突等场景。此外，API 接口契约通过 OpenAPI 3.0.3 规范定义（api-contract.yaml），前后端基于契约独立开发，保证接口一致性。统一响应格式 {code, message, data} 和完整错误码体系确保异常场景的友好提示。285 个测试用例 100% 通过，需求覆盖追溯显示全部功能需求 100% 覆盖。

**回答要点**：三层测试（服务单元 + 中间件单元 + 集成）+ OpenAPI 契约 + 统一响应格式

---

## 六、扩展与改进类（1 题）

### Q20. 系统还有哪些可以改进的地方？

**参考答案**：
系统目前有五个可改进方向。第一是性能优化：examService 的 listExams 方法存在 N+1 查询问题，每场考试循环查询班级和学生数，可优化为批量查询或 JOIN 联表；gradeService 自动阅卷在事务中逐条更新 answers 表，大量答卷时可能性能瓶颈，可改为批量更新；paperService 随机组卷使用 Math.random() 排序，题目量大时可改用数据库随机采样（如 ORDER BY RAND() LIMIT n）。第二是前端测试完善：3 个涉及 Ant Design 5 组件的测试套件因 jsdom 环境 CSS-in-JS 和 Icon 渲染兼容性限制未能完整运行，可配置 @ant-design/testing-utils 或改用 jsdom 兼容方案。第三是功能扩展：主观题可引入 AI 自动评分（基于自然语言处理），实现智能阅卷；可增加自适应出题，根据学生答题情况动态调整难度；可开发移动端原生 APP 或小程序。第四是架构扩展：引入 Redis 缓存考试计时、验证码、热点题库数据，减轻数据库压力；引入消息通知（如考试开始提醒、阅卷完成通知）。第五是运维增强：引入 Docker 容器化部署简化运维；增加 Prometheus 监控与日志告警。

**回答要点**：三项性能优化 + 前端测试完善 + AI 阅卷/自适应出题 + Redis 缓存 + Docker 运维

---

## 答辩前复习要点

1. **核心代码必读**：authService.js（登录认证）、paperService.js（随机组卷）、examStore.js（断网续答）、gradeService.js（自动阅卷）、scoreService.js（成绩统计）
2. **关键数字记忆**：54 功能需求 + 22 非功能需求、12 张表、39 个 API、285 测试用例、核心覆盖率 > 90%
3. **技术亮点原理**：随机组卷事务、防作弊事件监听、断网续答 localStorage、题型差异化阅卷
4. **架构图能画**：五层架构、ER 关系图、JWT 认证流程
5. **诚实原则**：不会的问题坦诚说"这个方面我考虑得不够深入，后续会继续完善"，不要编造

---

## 可能的追问预判

| 追问方向 | 应对策略 |
|----------|----------|
| 为什么不做微服务？ | 毕设规模 ≤100 并发，单体足够，微服务引入分布式复杂度不必要 |
| 100 并发怎么测的？ | 坦诚说明未做压测，基于 Node.js 非阻塞特性与连接池的理论支撑 |
| 软删除怎么实现？ | Sequelize paranoid 模式，deleted_at 字段，查询自动过滤 deleted_at: null |
| 事务隔离级别？ | MySQL InnoDB 默认 REPEATABLE READ，组卷与阅卷事务足够 |
| JWT 续期怎么做？ | 当前 2h 有效期，续期可在 token 即将过期时签发新 token，本期未实现 |