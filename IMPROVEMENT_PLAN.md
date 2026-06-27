# TestOps Platform — План улучшения (Backlog ТЗ)

**Документ:** Product Requirements / Detailed Backlog
**Авторы:** Senior PM · совместно с Senior QA + Senior BA
**Дата:** 27.06.2026
**Версия:** 1.0
**Статус:** Draft for review

---

## ✅ Статус реализации (обновлено 27.06.2026 — ВСЕ ПУНКТЫ ВЫПОЛНЕНЫ)

Реализовано как Senior Product Designer на основе данного ТЗ. Production-сборка зелёная (985 модулей).

| # | Фича | Было | Стало | Что сделано |
|---|------|:---:|:---:|------|
| #13 | Role-based views | 40% | **100%** | `permissions.ts` + `roleContext` · гейтинг Assets/Benches/Centers/Campaigns/Teams/Sharing · access-denied для Members/Logs/Integrations · topbar access-бейдж · Engineer≠HW-Eng |
| #4  | Center KPI view | 55% | **100%** | `lib/centerMetrics.ts` · Health Score (40/25/20/15) gauge · Cost/Efficiency quadrant · кликабельный drill-down |
| #3  | Multi-center dashboard | 80% | **100%** | чекбоксы на чипах · «Compare (N)» CTA + scroll · «Clear» · постоянная подсказка |
| #12b| AI Chat NLU | 30% | **100%** | `lib/chatNlu.ts` · intent+slot · реальный `runSimulation` · capacity/cost/risk из живых данных · assumptions-строка · scripted fallback |
| #7  | Bench reassignment | 80% | **100%** | перенос бенчей между центрами (Benches tab) · обновление benchIds · история переносов · gating |
| #6  | Sharing perspective | 90% | **100%** | «Viewing as» dropdown · убран хардкод MOCK_CENTER · approve только target-центр + роль |
| #1  | Center capacity | 90% | **100%** | KPI «X beds · Y in use (Z%)» в hero-стрипе |
| #2  | Geographic map | 85% | **100%** | `resolveCoords` для новых центров · пины из localCenters |
| #5  | Team→Bench binding | 95% | **100%** | bench-picker в builder · отображение на карточке (было реализовано) |

**Новые файлы:** `lib/centerMetrics.ts`, `lib/chatNlu.ts`, `permissions.ts`, `roleContext.ts`, `components/AccessDenied.tsx`.
**Решения зафиксированы:** веса 40/25/20/15 · нет Admin-роли · детерминированный NLU · mock-reset (без localStorage).

---

## 0. Резюме и приоритизация (MoSCoW)

Документ описывает **все незавершённые и частично выполненные** задачи с максимально
детальной механикой, изменениями модели данных, UX, и критериями приёмки (QA).

| # | Фича | Текущий % | Приоритет | Оценка (чел/дни) |
|---|------|:---:|:---:|:---:|
| #13 | Role-based views & permissions | 40% | **MUST** | 5–7 |
| #4  | Test Center-level KPI view (Health Score, cost/eff, drill-down) | 55% | **MUST** | 4–5 |
| #3  | Multi-center dashboard (явный multiselect UX) | 80% | **SHOULD** | 1.5–2 |
| #12b| AI Chat — реальный NLU слой (симулятор уже готов) | Chat 30% | **SHOULD** | 3–4 |
| #7  | Asset/Bench reassignment (перенос бенчей, гэпы) | 80% | **SHOULD** | 2–3 |
| #1  | Center как объект — поле «beds» / capacity KPI | 90% | **COULD** | 1 |
| #2  | Geographic map — динамика координат/центров | 85% | **COULD** | 1.5 |
| #5  | Team → Bench binding | 95% | **COULD** | 1 |
| #6  | Resource Sharing — мульти-перспектива (убрать MOCK_CENTER) | 90% | **COULD** | 2 |

**Итого:** ~21–26 чел/дней. Рекомендуемый порядок спринтов — сверху вниз.

> **Поправка к предыдущему аудиту:** Campaign Simulator (#12a) фактически готов на ~90% —
> полный параметрический движок стоимости/timeline/рисков в `AIInsights.tsx:69` (`runSimulation`).
> Незавершён только **AI Chat** (скриптованные ответы). Поэтому #12 разделён на 12a (done) / 12b (todo).

---

## #13 — Role-based Views & Permissions `MUST` · 40% → 100%

### Контекст (BA)
Сейчас `currentRole` (`manager | hw-engineer | engineer`) пробрасывается **только** в
`Dashboard` (`App.tsx:341`) и `BenchDetail` (`App.tsx:385`). Логика — исключительно
**сокрытие** (read-gating): Dashboard прячет heatmap для manager (`Dashboard.tsx:596`),
BenchDetail прячет вкладки Telemetry/Diagnostics (`BenchDetail.tsx:68`). Engineer и HW-Eng
сейчас **неотличимы**. Нет разграничения **действий** (write-gating) — любой может всё.

### Проблема
1. Роль не влияет на Assets, Campaigns, Teams, TestCenters, Members, Logs, ResourceSharing, IntegrationHub.
2. Нет разницы Engineer vs HW-Eng.
3. Нет permission-модели: гейтится «что видно», но не «что можно делать».

### User Stories
- Как **Manager**, я вижу агрегаты, стоимость, отчёты, апрувы — но не низкоуровневую телеметрию и не редактирую железо.
- Как **HW-Engineer**, я управляю бенчами/ассетами (checkout, flash, maintenance, transfer), вижу телеметрию и диагностику.
- Как **Engineer (Test)**, я работаю с кампаниями и DUT, вижу телеметрию read-only, но не трогаю инвентарь железа и не апрувлю запросы.

### Permission-матрица (BA — единый источник правды)

| Действие / Экран | Manager | HW-Eng | Engineer |
|---|:---:|:---:|:---:|
| Dashboard: агрегаты/стоимость | ✅ | ✅ | ✅ |
| Dashboard: heatmap/телеметрия | 🔒 hidden | ✅ | 👁 read |
| Bench: вкладки Telemetry/Diagnostics | 🔒 | ✅ | 👁 read |
| Bench: Flash firmware / Maintenance | 🔒 | ✅ | 🔒 |
| Assets: checkout/checkin | 👁 | ✅ | ✅ |
| Assets: register/edit/delete | 🔒 | ✅ | 🔒 |
| Assets: transfer между центрами | 🔒 | ✅ | 🔒 |
| Campaigns: создание/редактирование | ✅ | 👁 | ✅ |
| Campaigns: simulate | ✅ | ✅ | ✅ |
| Teams: CRUD | ✅ | 🔒 | 🔒 |
| TestCenters: create/edit/delete | ✅ | 🔒 | 🔒 |
| ResourceSharing: approve/reject | ✅ | ✅ | 🔒 |
| ResourceSharing: создать запрос | ✅ | ✅ | ✅ |
| IntegrationHub: connect/configure | ✅ | 🔒 | 🔒 |
| Members / Logs (Admin) | ✅ | 🔒 | 🔒 |

Легенда: ✅ полный доступ · 👁 read-only · 🔒 скрыто/заблокировано.

### Механика (PM)
1. **Централизованная permission-карта.** Создать `src/app/permissions.ts`:
   ```ts
   export type Capability =
     | "bench.telemetry.view" | "bench.firmware.flash" | "bench.maintenance"
     | "asset.checkout" | "asset.register" | "asset.transfer"
     | "campaign.edit" | "team.manage" | "center.manage"
     | "sharing.approve" | "integration.manage" | "admin.view";
   export const CAN: Record<Role, Set<Capability>> = { … };
   export const can = (role: Role, cap: Capability) => CAN[role].has(cap);
   ```
2. **Проброс роли вниз.** Пробросить `role` во все экраны через `App.tsx` (сейчас только 2).
3. **Гейтинг действий, не только вида:**
   - Кнопки запрещённых действий → **disabled + tooltip** «Requires HW-Engineer role» (не прятать молча — UX-прозрачность).
   - Целые админ-экраны (Members/Logs/IntegrationHub) для неуполномоченных → empty-state «You don't have access to this section» + предложение сменить роль (демо-режим).
4. **Дифференциация Engineer vs HW-Eng** — ключ к закрытию гэпа:
   - HW-Eng видит на Bench кнопки Flash/Maintenance; Engineer — нет.
   - Engineer видит телеметрию read-only (без кнопок управления), HW-Eng — с управлением.
   - В Assets: HW-Eng видит register/edit/delete/transfer; Engineer — только checkout/checkin.
5. **Визуальный индикатор контекста.** В topbar рядом с ролью — бейдж текущих прав (напр. «Edit access: Hardware»).

### Изменения модели данных
- Нет изменений в `data.ts`. Вся логика в `permissions.ts` + проброс пропа `role`.

### UX / UI
- Заблокированные кнопки: `opacity .45`, `cursor:not-allowed`, `title="Requires <role>"`.
- Read-only поля: убрать hover-эффекты, показать `🔒` иконку в углу панели.
- Admin empty-state: центрированная карточка с иконкой замка и подсказкой.

### Acceptance Criteria (QA)
- [ ] Переключение роли в сайдбаре мгновенно перестраивает доступность во **всех** экранах (не только Dashboard/Bench).
- [ ] Engineer и HW-Eng дают визуально и функционально **разный** опыт минимум в 3 экранах (Bench, Assets, Campaigns).
- [ ] Каждое запрещённое действие → disabled-кнопка с tooltip, **не** молчаливое исчезновение (кроме админ-секций).
- [ ] Manager не видит ни одной кнопки flash/maintenance/transfer.
- [ ] Admin-секции (Members/Logs/IntegrationHub) недоступны для Engineer/HW-Eng — показывают access-denied state.
- [ ] Нет регрессии: при роли по умолчанию (manager) поведение совпадает с текущим.

### Edge cases (QA)
- Роль меняется, когда открыт модал запрещённого теперь действия → модал должен закрыться/задизейблить submit.
- Drill-down из Dashboard в Bench под Manager → телеметрия остаётся скрытой и в детальном виде.
- ResourceSharing: Engineer может создать запрос, но не видит кнопок Approve на входящих.

---

## #4 — Test Center-level KPI view `MUST` · 55% → 100%

### Контекст (BA)
Detail-view центра (`TestCenters.tsx`) показывает health-статусы бенчей, состав ассетов,
людей, команды. Нет **числового Health Score**, нет связки **cost vs efficiency**, drill-down
из KPI слабый. Данные для расчёта **уже есть**: `computeCenterMetrics` (`Dashboard.tsx:176`)
считает avail/util/up/down/maint; у ассетов есть `cost`/`value` (`data.ts:11`).

### User Stories
- Как **Manager**, я вижу один Health Score (0–100) на центр и понимаю, где «болит», без чтения таблиц.
- Как **Manager**, я вижу стоимость инфраструктуры центра против его эффективности (выявить дорогие/недозагруженные центры).
- Как **Manager**, я кликаю по проблемному KPI и проваливаюсь в список конкретных объектов.

### Механика — Health Score (PM) · веса ЗАФИКСИРОВАНЫ 40/25/20/15
Композитный индекс **0–100**, взвешенная сумма:
```
HealthScore = round(
    0.40 * availabilityPct          // % бенчей в статусе Up
  + 0.25 * (100 - utilizationGap)   // близость к целевой утилизации 70% (штраф за <50 и >90)
  + 0.20 * passRatePct              // средний pass-rate кампаний центра
  + 0.15 * (100 - issueDensity)     // штраф за кол-во open issues на бенч
)
```
- `utilizationGap = abs(util - 70) * 2` (clamp 0–100) — наказывает и простой, и перегруз.
- `issueDensity = min(100, openIssues / benchCount * 25)`.
- Цветовые пороги: **≥80 зелёный**, **60–79 жёлтый**, **<60 красный** (как `statusFill` в `Dashboard.tsx:188`).
- Вывод: большой круговой gauge (переиспользовать `gaugeSVG` из AIInsights) + дельта к прошлому месяцу.

### Механика — Cost vs Efficiency (PM)
- **Cost базис:** `Σ asset.value` по `center.assetTags` + `benchCount * BENCH_COST_PER_WEEK` (реюз константы `AIInsights.tsx:24`).
- **Efficiency:** `utilizationPct * passRatePct / 100` → «полезная отдача».
- **Виджет:** scatter/quadrant 2×2 (ось X = cost, ось Y = efficiency) с точкой на центр; текущий центр подсвечен. Квадранты: «Efficient & Lean», «Efficient & Costly», «Underused & Lean», «Underused & Costly (⚠ кандидат на оптимизацию)».
- **KPI-строка:** `Cost/effective-hour = totalWeeklyCost / (benchHours * efficiency)`.

### Механика — Drill-down (PM)
- Каждая KPI-карточка на detail-view центра **кликабельна** → раскрывает inline-панель или скроллит к отфильтрованному списку:
  - «Availability 75%» → клик → список Down/Maintenance бенчей этого центра.
  - «3 issues» → клик → переиспользовать `IssueCard` из Dashboard, отфильтрованный по `centerName`.
  - «Cost €X» → клик → топ-5 самых дорогих ассетов центра.
- Реализация: `computeIssues` (`Dashboard.tsx:81`) уже умеет scope по центру — вынести в shared util и вызвать с `[centerId]`.

### Изменения модели данных
- Опционально добавить в `TestCenter` поле `targetUtilization?: number` (default 70) и `monthlyBudget?: number` для точного cost/eff. Если не добавлять — считать из ассетов/бенчей (достаточно для демо).
- Вынести `computeCenterMetrics` и `computeIssues` из `Dashboard.tsx` в `src/app/lib/centerMetrics.ts` для реюза в TestCenters.

### UX / UI
- Шапка detail-view центра: слева gauge Health Score, справа 3 вторичных KPI (Avail / Util / Cost-eff) — все кликабельны.
- Quadrant-чарт под шапкой, сворачиваемый.
- Drill-down — раскрывающаяся секция (accordion), без ухода со страницы.

### Acceptance Criteria (QA)
- [ ] Health Score отображается числом 0–100 + цвет по порогам ≥80/60–79/<60.
- [ ] Score пересчитывается при изменении статуса бенчей (проверить на mock-данных трёх центров — значения различаются).
- [ ] Cost vs Efficiency quadrant показывает 3 точки, текущий центр выделен.
- [ ] Клик по каждому KPI раскрывает релевантный список (down benches / issues / top assets).
- [ ] Underused & Costly центр визуально помечен как кандидат на оптимизацию.

### Edge cases (QA)
- Центр без живых бенчей (все Down) → util = 0, gauge красный, без деления на ноль.
- Центр без кампаний → passRate fallback (напр. n/a, вес перераспределяется).
- Drill-down пустой (0 issues) → empty-state «No issues in this center».

---

## #3 — Multi-center Dashboard `SHOULD` · 80% → 100%

### Контекст (BA)
Мультиселект **уже работает** механически: `toggle(id)` накапливает центры в `sel[]`
(`Dashboard.tsx:457`), есть side-by-side `CenterCompareCard` при `sel.length >= 2`
(`Dashboard.tsx:525`), агрегаты считаются по выбранным. **Проблема — открываемость (discoverability):**
пользователь не понимает, что чипы мультиселективны. Единственная подсказка — текст
«click multiple centers to compare» (`Dashboard.tsx:462`).

### Проблема
Это **UX-, не функциональный гэп**. Чипы выглядят как radio (один выбор), хотя ведут себя как checkbox.

### Механика (PM)
1. **Визуально сделать чипы похожими на toggle:** добавить чекбокс-иконку (✓) в активный чип, изменить курсор/hover, чтобы читалось «можно несколько».
2. **Постоянная подсказка** (не только в режиме All): микротекст «Select multiple to compare» рядом с лейблом Center всегда.
3. **«Compare» CTA:** когда выбрано ≥2 — кнопка «Compare selected (N)» скроллит к comparison-панели + бейдж счётчика (уже есть на `Dashboard.tsx:470`, усилить).
4. **«Clear»-чип** при `sel.length >= 1 && !all` для быстрого сброса.
5. **Sticky-поведение:** при скролле панель центр-селектора прилипает к топу (опционально).

### Изменения модели данных
- Нет.

### UX / UI
- Активный чип: галочка слева + `box-shadow` выделение.
- Hover неактивного: «+ add to compare».
- Comparison-панель: добавить заголовки-дельты между центрами (напр. «Munich на 12% выше по util»).

### Acceptance Criteria (QA)
- [ ] Новый пользователь без подсказки понимает, что можно выбрать несколько (валидация на юзабилити-тесте / эвристике).
- [ ] Выбор «Munich + Warsaw» одновременно показывает обе колонки сравнения и агрегат в KPI.
- [ ] Кнопка «Compare (N)» появляется при ≥2 и скроллит к панели.
- [ ] «Clear» сбрасывает к All Centers.
- [ ] Переключение All ↔ конкретные работает без рассинхрона KPI.

### Edge cases (QA)
- Выбор всех 3 центров вручную ≈ режиму All — KPI должны совпасть.
- Снятие выбора до 0 центров → авто-возврат к All Centers (не пустой экран).

---

## #12b — AI Chat: реальный NLU-слой `SHOULD` · Chat 30% → 80%

### Контекст (BA)
**Campaign Simulator (#12a) готов** — `runSimulation` (`AIInsights.tsx:69`) — полноценный движок.
Незавершён **AI Chat** (`AIChat.tsx`): ответы скриптованы, нет привязки к реальным данным/симулятору.

### Проблема
Чат «отвечает» захардкоженными строками, не вызывает симулятор, не читает реальные данные
(benches/assets/centers), не извлекает параметры из запроса.

### User Stories
- Как пользователь, я пишу «Simulate a 6-week endurance campaign in Warsaw with 12 DUTs» — и чат запускает реальную симуляцию и возвращает стоимость/timeline.
- Как пользователь, я спрашиваю «Which center has the lowest bench load?» — и получаю ответ из живых данных, а не заглушку.

### Механика — лёгкий intent/slot NLU (PM, без внешнего API)
Детерминированный парсер (regex + keyword-scoring), достаточно для демо:
1. **Intent-классификация** по ключевым словам:
   - `simulate|plan|campaign|cost|how long|timeline` → **SIMULATE**
   - `load|utilization|busiest|free|available` → **CAPACITY_QUERY**
   - `cheapest|cost|expensive|budget` → **COST_QUERY**
   - `risk|blocked|at risk|delayed` → **RISK_QUERY**
   - иначе → fallback с подсказками.
2. **Slot-extraction** для SIMULATE:
   - центр: матч по `city`/`id` из `TEST_CENTERS`.
   - DUT count: `\d+\s*(duts?|devices?)`.
   - длительность: `\d+\s*(week|w|day)`.
   - тип кампании: матч по словарю `DUT_PER_BENCH` ключей.
   - дефолты для незаполненных слотов + явное проговаривание допущений в ответе.
3. **Вызов реального движка:** собрать `SimParams` → вызвать `runSimulation` → отрендерить
   ответ карточкой (стоимость, недели, feasibility, топ-2 риска). Переиспользовать существующий результат-рендер.
4. **CAPACITY/COST/RISK queries:** считать на лету из `BENCHES_INITIAL`/`ASSETS_INITIAL`/`DATA.campaigns`
   (реюз `computeCenterMetrics`, `computeIssues`).
5. **Прозрачность:** в ответе показывать «Assumptions: center=Warsaw, DUTs=12 (default type=Endurance)» — чтобы было видно, что распознано.

### Изменения модели данных
- Нет. Новый модуль `src/app/lib/chatNlu.ts` (intent + slots). Экспортировать `runSimulation` из AIInsights (частично уже экспортируется `CampaignSimulator`).

### UX / UI
- Сообщение-ответ симуляции — компактная карточка с CTA «Open full simulator» (открывает модал в Campaigns с предзаполненными параметрами).
- Loading-состояние «Running simulation…» (1–1.5s, как в реальном движке).
- При нераспознанном intent — chips с примерами валидных запросов.

### Acceptance Criteria (QA)
- [ ] Запрос с центром + DUT + неделями запускает `runSimulation` и возвращает **те же** числа, что и UI-симулятор при тех же параметрах.
- [ ] Capacity-query возвращает реальный центр с мин/макс загрузкой из данных.
- [ ] Извлечённые слоты явно показаны пользователю (assumptions line).
- [ ] Нераспознанный запрос → подсказки, не пустота и не ложный ответ.
- [ ] «Open full simulator» открывает модал с предзаполненными значениями.

### Edge cases (QA)
- Несуществующий центр («simulate in Berlin») → ответ «Center not found, did you mean Munich/Stuttgart/Warsaw?».
- Параметры за пределами разумного (1000 DUTs) → симулятор показывает infeasible + рекомендацию.
- Запрос без чисел → дефолты + явное предупреждение об использованных допущениях.

---

## #7 — Asset & Bench Reassignment `SHOULD` · 80% → 100%

### Контекст (BA)
В Assets есть вкладка **Transfers** (`Assets.tsx:822`), `moveHistory` с записью истории
(`Assets.tsx:454`), bulk-bar (`Assets.tsx:544`), TransferModal. Реализовано больше, чем
в исходном аудите. **Гэпы:** (1) бенчи между центрами не переносятся; (2) история переносов
не персистится между сессиями (mock state, ок для демо); (3) bulk-transfer есть, проверить полноту.

### User Stories
- Как **HW-Engineer**, я переношу бенч из Munich в Warsaw, и связи center→bench обновляются с записью в историю.
- Как **HW-Engineer**, я выбираю несколько ассетов и переношу их одной операцией с единой причиной/датой.

### Механика — Bench transfer (PM)
1. На `TestBenches` / `BenchDetail` добавить действие **«Move to center»** (gated `asset.transfer`, см. #13).
2. Модал: текущий центр (из `TEST_CENTERS.find(c => c.benchIds.includes(benchId))`) → выбор нового → причина → дата.
3. Применение: убрать `benchId` из `benchIds` старого центра, добавить в новый (immutable update в App-state, где живут центры — сейчас `TEST_CENTERS` статичен → **поднять в state**, см. ниже).
4. Запись в общую `moveHistory` (унифицировать с asset-историей: `{type:'bench'|'asset', id, from, to, by, reason, ts}`).

### Изменения модели данных
- **Поднять `TEST_CENTERS` в React-state** (сейчас импортируется как константа в `App.tsx:2`).
  Это блокер и для #1/#4 редактирования. Создать `const [centers, setCenters] = useState(TEST_CENTERS)`
  и пробросить вниз вместо прямого импорта. **Это рефактор-предусловие** для нескольких фич.
- Унифицировать тип истории перемещений `MovementRecord`.

### UX / UI
- Bench-transfer модал — зеркало asset-transfer (консистентность).
- В Transfers-вкладке показывать оба типа (asset + bench) с иконкой-различителем.
- Подтверждение перед переносом активного (занятого кампанией) бенча — warning.

### Acceptance Criteria (QA)
- [ ] Перенос бенча обновляет `benchIds` обоих центров; бенч исчезает из старого detail-view и появляется в новом.
- [ ] Запись появляется в Transfers-истории с from/to/by/reason/timestamp.
- [ ] Bulk-transfer ассетов: выбор N, одна причина → N записей в истории, все ассеты сменили локацию.
- [ ] Перенос занятого бенча требует подтверждения.
- [ ] Gating: Engineer/Manager не видят кнопку transfer (связка с #13).

### Edge cases (QA)
- Перенос последнего бенча из центра → центр с 0 бенчей (валидный, но health=0).
- Перенос в тот же центр → no-op + тост «Already in this center».
- Откат: undo-тост в течение 5с (опционально).

---

## #1 — Test Center «beds»/Capacity KPI `COULD` · 90% → 100%

### Контекст
Wizard create/edit и delete уже есть (`TestCenters.tsx:467,1382`). Отсутствует **выделенный
показатель «beds»** на уровне центра (beds живут на bench-уровне).

### Механика
- Добавить вычисляемый KPI **Capacity** = `Σ bench.beds` по бенчам центра (если у бенча есть поле beds;
  иначе `benchCount`). Показать в шапке detail-view: «Capacity: 24 beds across 8 benches · 18 in use (75%)».
- Источник «in use» — из кампаний/занятости бенчей.

### Изменения данных
- Если у `TestBench` нет поля `beds` — добавить (default 1–3) либо считать из telemetry-слотов.

### Acceptance Criteria (QA)
- [ ] Detail-view центра показывает total beds, in-use, % — согласованно с bench-данными.
- [ ] Изменение состава бенчей (через #7 transfer) пересчитывает capacity.

---

## #2 — Geographic Map: динамика `COULD` · 85% → 100%

### Контекст
`MapView.tsx` рисует мир + пины, клик работает (`onSelect`, `TestCenters.tsx:1429`).
Координаты берутся из `TEST_CENTERS.lat/lng` (данные уже динамические!). Гэп: центры
захардкожены числом 3; при добавлении центра через wizard пин не появляется, если центр
не в state.

### Механика
- После рефактора «центры в state» (#7) — `MapView` рендерит пины из текущего `centers[]`,
  включая созданные через wizard. Новый центр → новый пин с его lat/lng (wizard уже собирает город/страну;
  добавить geocode-заглушку: словарь город→координаты или ручной ввод lat/lng на шаге 1).
- Клик по пину → переход в detail-view (уже есть через `onSelect`), убедиться что работает и для новых.

### Acceptance Criteria (QA)
- [ ] Центр, созданный через wizard, появляется пином на карте.
- [ ] Пин нового центра кликабелен и ведёт в его detail-view.
- [ ] Пин окрашен по Health Score (#4) — связка фич.

---

## #5 — Team → Bench Binding `COULD` · 95% → 100%

### Контекст
Teams CRUD полный, привязка к Center есть. Нет привязки команды к **конкретному бенчу**.

### Механика
- В Team-builder добавить опциональный шаг/секцию «Assigned benches» — мультиселект бенчей
  из центра команды (фильтр по `center.benchIds`).
- Хранить `team.benchIds?: string[]`. Показывать на карточке команды и в bench-detail («Owned by: Team X»).

### Acceptance Criteria (QA)
- [ ] В builder можно выбрать бенчи только из центра команды.
- [ ] BenchDetail показывает команду-владельца, если назначена.
- [ ] Снятие назначения убирает связь с обеих сторон.

---

## #6 — Resource Sharing: мульти-перспектива `COULD` · 90% → 100%

### Контекст
`ResourceSharing.tsx` работает, но «я» захардкожен `MOCK_CENTER = "TC-MUC"` (`:24`).
Incoming/Outgoing считаются от лица Munich. Approve/Reject зависят от перспективы.

### Механика
- Заменить `MOCK_CENTER` на выбор «текущего центра» из шапки (dropdown «Viewing as: Munich ▾»).
  При смене — Incoming/Outgoing/доступные ресурсы/права на approve пересчитываются.
- Связать с #13: approve-кнопки доступны только если роль позволяет (`sharing.approve`) **и** ты — target-центр.

### Acceptance Criteria (QA)
- [ ] Смена «Viewing as» меняет состав Incoming/Outgoing и доступные для шаринга ресурсы.
- [ ] Approve доступен только target-центру запроса.
- [ ] Связка с ролью: Engineer не видит approve даже будучи в target-центре.

---

## Кросс-фичевые предусловия (Tech enablers)

Эти рефакторы разблокируют несколько фич — делать **первыми**:

1. **`TEST_CENTERS` → React state** в `App.tsx` (блокер для #1 edit, #2 динамики, #4, #6, #7 bench-transfer). State держим **только в памяти (mock-reset)** — НЕ в localStorage; F5 откатывает к seed-данным.
2. **Вынести `computeCenterMetrics` + `computeIssues`** из `Dashboard.tsx` в `src/app/lib/centerMetrics.ts` (реюз в #4, #12b).
3. **`src/app/permissions.ts`** — централизованная capability-карта (#13, #6, #7).
4. **Унифицированный `MovementRecord`** тип для истории (#7).
5. **Экспорт `runSimulation`** из AIInsights для вызова из чата (#12b).

---

## Рекомендуемый план спринтов

**Спринт 1 (enablers + MUST):** Tech enablers 1–3 → #13 Role-based → #4 Center KPI. (~10–12 дн)
**Спринт 2 (SHOULD):** #3 multiselect UX → #12b AI Chat NLU → #7 bench transfer. (~7–9 дн)
**Спринт 3 (COULD/полировка):** #1 capacity → #2 map dynamics → #5 team-bench → #6 sharing perspective. (~5–6 дн)

---

## Решения по стейкхолдер-вопросам (зафиксировано 27.06.2026)

1. **#4 Health Score веса** — ✅ **РЕШЕНО: 40/25/20/15** (Availability/Utilization-fit/Pass-rate/Issue-density). Утверждено как есть; пороги цвета ≥80/60–79/<60.
2. **#13 Permissions — Admin-роль** — ✅ **РЕШЕНО: НЕ нужна.** Остаются 3 роли: `manager | hw-engineer | engineer`. Manager выполняет админ-функции.
3. **#12b AI Chat NLU** — ✅ **РЕШЕНО: детерминированный** (intent + slot, regex/keyword-scoring). Реальный LLM-вызов НЕ требуется для демо.
4. **Персистентность state** — ✅ **РЕШЕНО: Mock-reset.** State живёт только в React-памяти; F5/закрытие вкладки → откат к seed-данным. localStorage НЕ внедряем (исключение — тема, она уже персистится). Кнопка «Reset demo» не нужна.

### Открытые (минор, не блокеры)
- **#1 Capacity** — «bed» = физический слот или логическая единица? Уточнить перед реализацией #1 (COULD-приоритет, можно отложить).
