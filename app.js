(() => {
  "use strict";

  const money = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  });

  const readNumber = (id) => {
    const input = document.getElementById(id);
    if (!input || input.value.trim() === "") return null;
    const value = Number(input.value);
    return Number.isFinite(value) && value >= 0 && Number.isInteger(value) ? value : NaN;
  };

  const checkedValue = (name) => {
    const input = document.querySelector(`input[name="${name}"]:checked`);
    return input ? input.value : "";
  };

  const formatMoney = (value) => {
    const numeric = value || 0;
    return money.format(numeric);
  };

  const checker = document.getElementById("mtd-checker");
  const checkerResult = document.getElementById("checker-result");
  const checkerError = document.getElementById("checker-error");
  const incomeFields = document.getElementById("income-fields");
  const returnQuestion = document.getElementById("return-question");
  const scopeQuestions = document.getElementById("scope-questions");

  const incomeYears = {
    "2425": { threshold: 50000, start: "6 April 2026", returnLabel: "2024/25", firstDeadline: "7 August 2026" },
    "2526": { threshold: 30000, start: "6 April 2027", returnLabel: "2025/26", firstDeadline: "7 August 2027" },
    "2627": { threshold: 20000, start: "6 April 2028", returnLabel: "2026/27", firstDeadline: "7 August 2028" }
  };

  function setIncomeVisibility(type) {
    const showSole = type === "sole" || type === "both";
    const showProperty = type === "property" || type === "both";
    const hasRelevantIncome = type !== "neither";

    document.querySelectorAll(".sole-field").forEach((field) => field.classList.toggle("is-hidden", !showSole));
    document.querySelectorAll(".property-field").forEach((field) => field.classList.toggle("is-hidden", !showProperty));
    document.querySelectorAll(".property-safeguard").forEach((field) => field.classList.toggle("is-hidden", !showProperty));
    incomeFields?.classList.toggle("is-hidden", !hasRelevantIncome);
    returnQuestion?.classList.toggle("is-hidden", !hasRelevantIncome);
    scopeQuestions?.classList.toggle("is-hidden", !hasRelevantIncome);
  }

  document.querySelectorAll('input[name="incomeType"]').forEach((input) => {
    input.addEventListener("change", () => setIncomeVisibility(input.value));
  });

  function yearValues(year, type) {
    const usesSole = type === "sole" || type === "both";
    const usesProperty = type === "property" || type === "both";
    const sole = usesSole ? readNumber(`sole-${year}`) : 0;
    const property = usesProperty ? readNumber(`property-${year}`) : 0;
    const optionalYear = year === "2627";

    if (Number.isNaN(sole) || Number.isNaN(property)) return { invalid: true };
    const allRelevantFieldsBlank = (!usesSole || sole === null) && (!usesProperty || property === null);
    if (optionalYear && allRelevantFieldsBlank) return { sole: null, property: null, total: null };
    const missingSole = usesSole && sole === null;
    const missingProperty = usesProperty && property === null;
    if (missingSole || missingProperty) return { unknown: true };

    const cleanSole = sole === null ? 0 : sole;
    const cleanProperty = property === null ? 0 : property;
    return { sole: cleanSole, property: cleanProperty, total: cleanSole + cleanProperty };
  }

  function renderNoRelevantIncome() {
    checkerResult.className = "result-card has-result";
    checkerResult.innerHTML = `
      <span class="result-label">Outside this checker</span>
      <strong class="result-date">No personal MTD date shown</strong>
      <p class="result-reason">The current MTD for Income Tax rollout is for individuals with qualifying sole-trade and/or property income. A limited company's turnover is not entered here. An individual partner's share of partnership profit does not count toward qualifying income, although it remains reportable on the tax return; separate personal self-employment or property income can count.</p>
      <div class="result-actions">
        <a class="primary-action" href="https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax" target="_blank" rel="noopener">Check your exact position with HMRC <span aria-hidden="true">↗</span></a>
        <a href="https://www.gov.uk/guidance/work-out-your-qualifying-income-for-making-tax-digital-for-income-tax" target="_blank" rel="noopener">Read HMRC's qualifying-income guidance <span aria-hidden="true">↗</span></a>
      </div>
      <p class="result-caveat">Partnerships themselves are currently exempt and have a later timetable. Personal self-employment or property income that a partnership tells an individual about can count; confirm the exact treatment with HMRC.</p>
    `;
  }

  function renderCheckerStop(label, title, reason, caveat = "No income-threshold date has been calculated.") {
    checkerResult.className = "result-card has-result";
    checkerResult.innerHTML = `
      <span class="result-label">${label}</span>
      <strong class="result-date">${title}</strong>
      <p class="result-reason">${reason}</p>
      <div class="result-actions">
        <a class="primary-action" href="https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax" target="_blank" rel="noopener">Use HMRC's checker <span aria-hidden="true">↗</span></a>
        <a href="https://www.gov.uk/guidance/find-out-if-you-can-get-an-exemption-from-making-tax-digital-for-income-tax" target="_blank" rel="noopener">Check exemption rules <span aria-hidden="true">↗</span></a>
      </div>
      <p class="result-caveat">${caveat}</p>
    `;
  }

  function renderCheckerResult(outcome, values) {
    let label;
    let mainDate;
    let reason;
    let decisiveYear = null;

    if (outcome) {
      decisiveYear = incomeYears[outcome.year];
      label = "Threshold-only indication";
      mainDate = decisiveYear.start;
      reason = `Your combined whole-pound qualifying-income figures for ${decisiveYear.returnLabel} total ${formatMoney(outcome.total)}, which is more than ${formatMoney(decisiveYear.threshold)}. This is not a final eligibility decision.`;
    } else {
      const futureMissing = values["2627"].total === null;
      if (futureMissing) {
        label = "No threshold date found yet";
        mainDate = "2026/27 figure still needed";
        reason = "The figures entered do not cross the April 2026 or April 2027 thresholds. Because 2026/27 is blank, this tool cannot test the more-than-£20,000 threshold for April 2028.";
      } else {
        label = "Income-based exemption indicated";
        mainDate = "No start date from these figures";
        reason = "The figures entered do not cross any published threshold. HMRC describes qualifying income of £20,000 or less as an automatic exemption for the applicable tax year; recheck if your income, circumstances or HMRC guidance changes.";
      }
    }

    const math = outcome
      ? `<div class="result-math">
          <div><span>Sole-trade turnover</span><strong>${formatMoney(outcome.values.sole)}</strong></div>
          <div><span>Your property-income share</span><strong>${formatMoney(outcome.values.property)}</strong></div>
          <div><span>Combined</span><strong>${formatMoney(outcome.total)}</strong></div>
        </div>`
      : "";

    const deadline = outcome
      ? `<p class="route-note"><strong>Planning marker:</strong> digital records normally start on 6 April for a tax-year accounting period, or 1 April for a 31-March calendar period. The first quarterly-update deadline is ${decisiveYear.firstDeadline}. Verify your period and obligations with HMRC or your software provider.</p>`
      : "";

    checkerResult.className = "result-card has-result";
    checkerResult.innerHTML = `
      <span class="result-label">${label}</span>
      <strong class="result-date">${mainDate}</strong>
      <p class="result-reason">${reason}</p>
      ${math}
      ${deadline}
      <div class="result-actions">
        <a class="primary-action" href="https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax" target="_blank" rel="noopener">Confirm with HMRC's checker <span aria-hidden="true">↗</span></a>
        <a href="#route">Choose a record-keeping route <span aria-hidden="true">↓</span></a>
        <a href="guides/mtd-30k-threshold.html">Read what the income figure includes <span aria-hidden="true">→</span></a>
      </div>
      <p class="result-caveat">Threshold-only educational result. You confirmed the calculator's safety questions, but HMRC's checker remains the final step.</p>
    `;
  }

  if (checker) {
    setIncomeVisibility(checkedValue("incomeType") || "sole");

    checker.addEventListener("submit", (event) => {
      event.preventDefault();
      checkerError.textContent = "";
      const type = checkedValue("incomeType");

      if (type === "neither") {
        renderNoRelevantIncome();
        checkerResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      const submittedReturn = checkedValue("submittedReturn");
      if (submittedReturn !== "yes") {
        renderCheckerStop(
          "First return needed",
          "No start date calculated",
          "HMRC says you do not need to start MTD for Income Tax until after submitting your first Self Assessment return. Filing that return is not itself an MTD start date; HMRC must assess your position.",
          "Submit the first return, then use HMRC's checker and follow its sign-up instructions."
        );
        checkerResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      if (checkedValue("exemptionCheck") !== "confirmed") {
        renderCheckerStop(
          "Exemption check required",
          "No threshold date shown",
          "Income alone cannot establish that MTD is mandatory. HMRC lists automatic, temporary and application-based exemptions that this calculator does not reproduce.",
          "Check the exemption guidance, then return only if you can confirm that no exemption other than being below an income threshold applies."
        );
        checkerResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      if (checkedValue("twelveMonthPeriods") !== "yes") {
        renderCheckerStop(
          "Annualisation needed",
          "This calculator must stop",
          "HMRC annualises qualifying income for accounting periods that are shorter or longer than 12 months. This calculator deliberately does not estimate that adjustment."
        );
        checkerResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      if (checkedValue("allSourcesCeased") !== "no") {
        renderCheckerStop(
          "Cessation rules apply",
          "This calculator must stop",
          "A ceased source may still count when another qualifying source continues, while you do not need MTD for Income Tax if every qualifying source has ceased. HMRC must check which rule applies."
        );
        checkerResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      const usesProperty = type === "property" || type === "both";
      if (usesProperty && checkedValue("propertySpecialCase") !== "no") {
        renderCheckerStop(
          "Residence or ownership rules apply",
          "This calculator must stop",
          "Foreign-property, residence, SA109 and jointly owned-property cases can change the amount HMRC assesses. Use HMRC's checker or a qualified adviser for these figures."
        );
        checkerResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      const values = {
        "2425": yearValues("2425", type),
        "2526": yearValues("2526", type),
        "2627": yearValues("2627", type)
      };

      if (Object.values(values).some((value) => value.invalid)) {
        checkerError.textContent = "Enter zero or a positive whole-pound amount in each relevant field.";
        return;
      }

      if (Object.values(values).some((value) => value.unknown)) {
        checkerError.textContent = "Enter every relevant historical return figure. Use £0 only when the selected source genuinely had no qualifying income; leave the entire 2026/27 estimate blank if unknown.";
        return;
      }

      let outcome = null;
      for (const year of ["2425", "2526", "2627"]) {
        const total = values[year].total;
        if (total !== null && total > incomeYears[year].threshold) {
          outcome = { year, total, values: values[year] };
          break;
        }
      }

      renderCheckerResult(outcome, values);
      checkerResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    document.getElementById("checker-submit")?.addEventListener("click", () => {
      checker.requestSubmit();
    });
  }

  const routePlanner = document.getElementById("route-planner");
  const routeResult = document.getElementById("route-result");

  const routeDefinitions = {
    bridge: {
      title: "Spreadsheet + compatible bridging software",
      explanation: "You want the least disruption and already have digital records. HMRC says bridging software can connect to existing spreadsheet records, but the products together must cover every submission you need to make.",
      key: "Preserve the spreadsheet",
      detail: "Clean up categories and dates, then compare compatible bridging products in HMRC's finder. Submit the return for the year before MTD as normal; for each MTD year, confirm the complete setup can add other income and submit the Self Assessment return through compatible software."
    },
    verify: {
      title: "Verify your current software before switching",
      explanation: "A familiar product can be the lowest-risk route if its exact plan supports all of your income sources, quarterly updates, other-income reporting, and the final tax return.",
      key: "Ask the precise compatibility question",
      detail: "Check the product and plan in HMRC's finder, then ask the provider whether your marketplace workflow and every income source are supported."
    },
    allInOne: {
      title: "Move to an all-in-one digital record system",
      explanation: "Paper records or a desire to combine banking, invoices and bookkeeping point toward a fuller system. Compare total fees and workflow fit; do not choose a business account solely because a website earns commission.",
      key: "Trial the workflow with sample transactions",
      detail: "Test sales, refunds, marketplace fees and receipt capture before moving the whole year. Verify HMRC recognition on the day you choose."
    },
    connector: {
      title: "Marketplace connector + accounting software",
      explanation: "Several marketplaces and payment processors can create reconciliation work that a general ledger alone does not remove. A connector may help, but only if the combined products preserve the records and submissions you need.",
      key: "Reconcile one real payout end to end",
      detail: "Map gross sales, refunds, platform fees and the net deposit for one period. Confirm how data reaches the compatible accounting/submission product."
    },
    agent: {
      title: "Agent-led route with compatible software",
      explanation: "Mixed property and trading income, foreign income, several businesses, or uncertainty about the figures is a good reason to involve a qualified accountant or tax adviser before changing systems.",
      key: "Agree who records and who submits",
      detail: "Ask the agent which software they support, whether you keep the source records, and who authorises and sends each quarterly update and the tax return."
    }
  };

  function chooseRoute(records, priority, complexity) {
    if (complexity === "complex" || complexity === "mixed" || priority === "support" || records === "accountant") return "agent";
    if (records === "software") return "verify";
    if (complexity === "multi" && priority === "automation") return "connector";
    if (records === "spreadsheet" && priority === "least-change") return "bridge";
    if (records === "paper" || priority === "one-place") return "allInOne";
    if (records === "spreadsheet" && priority === "automation") return "connector";
    return "allInOne";
  }

  if (routePlanner) {
    routePlanner.addEventListener("submit", (event) => {
      event.preventDefault();
      const records = checkedValue("records");
      const priority = document.getElementById("priority").value;
      const complexity = document.getElementById("complexity").value;
      const route = routeDefinitions[chooseRoute(records, priority, complexity)];

      routeResult.className = "result-card route-result";
      routeResult.innerHTML = `
        <span class="result-label">Suggested route</span>
        <h3>${route.title}</h3>
        <p>${route.explanation}</p>
        <div class="route-plan">
          <div class="route-plan-item">
            <span>1</span><div><strong>Confirm whether and when MTD applies</strong><p>Use HMRC's service for the final eligibility decision, including any possible exemption.</p></div>
          </div>
          <div class="route-plan-item is-key">
            <span>2</span><div><strong>${route.key}</strong><p>${route.detail}</p></div>
          </div>
          <div class="route-plan-item">
            <span>3</span><div><strong>Verify the whole submission path</strong><p>The product or products must handle your income sources, digital records, quarterly updates, other income and tax return.</p></div>
          </div>
        </div>
        <p class="route-note">HMRC recognises software products but does not recommend them. Product status, plans and features can change.</p>
        <div class="route-links">
          <a href="https://www.gov.uk/guidance/choose-the-right-software-for-making-tax-digital-for-income-tax" target="_blank" rel="noopener">HMRC software guidance ↗</a>
          <a href="guides/mtd-spreadsheets.html">Spreadsheet guide →</a>
        </div>
      `;
      routeResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    document.getElementById("route-submit")?.addEventListener("click", () => {
      routePlanner.requestSubmit();
    });
  }

  const worksheet = document.getElementById("payout-worksheet");
  if (worksheet) {
    const calculateWorksheet = () => {
      const sales = Math.max(0, Number(document.getElementById("worksheet-sales").value) || 0);
      const refunds = Math.max(0, Number(document.getElementById("worksheet-refunds").value) || 0);
      const fees = Math.max(0, Number(document.getElementById("worksheet-fees").value) || 0);
      const adjustments = Number(document.getElementById("worksheet-adjustments").value) || 0;
      const actual = Math.max(0, Number(document.getElementById("worksheet-actual").value) || 0);
      const expectedPayout = sales - refunds - fees + adjustments;
      document.getElementById("worksheet-output").textContent = preciseMoney.format(expectedPayout);
      document.getElementById("worksheet-sales-output").textContent = preciseMoney.format(sales - refunds);
      document.getElementById("worksheet-difference").textContent = preciseMoney.format(expectedPayout - actual);
    };
    worksheet.addEventListener("input", calculateWorksheet);
    calculateWorksheet();
  }
})();
