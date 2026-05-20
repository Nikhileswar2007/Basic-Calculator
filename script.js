"use strict";

const state = {
  currentInput: "0",  
  previousInput: "",   
  operator: null,     
  shouldResetDisplay: false, 
  justCalculated: false, 
  expression: "",    
};

const displayEl    = document.getElementById("display");     
const expressionEl = document.getElementById("expression");   
const allButtons   = document.querySelectorAll(".btn");       

function formatDisplay(value) {
  if (value === "Error" || value === "Infinity" || value === "-Infinity") {
    return "Error";
  }

  const num = parseFloat(value);

  if (isNaN(num)) return "Error";

  if (Number.isInteger(num) && Math.abs(num) < 1e12) {
    return num.toLocaleString("en-US"); 
  }

  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-7 && num !== 0)) {
    return num.toExponential(4);
  }
  return parseFloat(num.toPrecision(10)).toString();
}

function updateDisplay(value) {
  const formatted = formatDisplay(value);
  displayEl.textContent = formatted;
  const len = formatted.replace(/[,. ]/g, "").length;
  if (len > 12) {
    displayEl.style.fontSize = "clamp(1rem, 4vw, 1.4rem)";
  } else if (len > 9) {
    displayEl.style.fontSize = "clamp(1.2rem, 5vw, 1.8rem)";
  } else {
    displayEl.style.fontSize = "clamp(1.8rem, 8vw, 2.8rem)";
  }
}

function updateExpression(text) {
  expressionEl.classList.remove("fade-in");
  void expressionEl.offsetWidth;
  expressionEl.textContent = text || "\u00A0"; 
  expressionEl.classList.add("fade-in");
}

function triggerError(message = "Error") {
  updateDisplay(message);
  const panel = displayEl.closest(".display-panel");
  panel.classList.remove("shake");
  void panel.offsetWidth;
  panel.classList.add("shake");
  state.currentInput = "0";
  state.previousInput = "";
  state.operator = null;
  state.shouldResetDisplay = false;
  state.justCalculated = false;
  updateExpression("");
}

function highlightOperator(op) {
  document.querySelectorAll(".btn-operator").forEach((btn) => {
    btn.classList.remove("active-op");
    if (btn.dataset.operator === op) {
      btn.classList.add("active-op");
    }
  });
}

function inputDigit(digit) {
  if (state.justCalculated && !state.shouldResetDisplay) {
    state.currentInput = digit;
    state.justCalculated = false;
    updateDisplay(state.currentInput);
    return;
  }

  if (state.shouldResetDisplay) {
    state.currentInput = digit;
    state.shouldResetDisplay = false;
  } else {
    if (state.currentInput.replace(/[^0-9]/g, "").length >= 15) return;
    state.currentInput =
      state.currentInput === "0" ? digit : state.currentInput + digit;
  }
  updateDisplay(state.currentInput);
}

function inputDecimal() {
  if (state.shouldResetDisplay) {
    state.currentInput = "0.";
    state.shouldResetDisplay = false;
    updateDisplay(state.currentInput);
    return;
  }

  if (state.currentInput.includes(".")) return;
  state.currentInput += ".";
  updateDisplay(state.currentInput);
}

function inputOperator(op) {
  const current = parseFloat(state.currentInput);
  if (state.operator && !state.shouldResetDisplay) {
    const result = calculate(parseFloat(state.previousInput), current, state.operator);
    if (result === null) return;
    state.currentInput = String(result);
    updateDisplay(state.currentInput);
  }

  state.previousInput = state.currentInput;
  state.operator = op;
  state.shouldResetDisplay = true;
  state.justCalculated = false;
  updateExpression(`${formatDisplay(state.previousInput)} ${op}`);
  highlightOperator(op);
}

function calculate(a, b, op) {
  let result;
  switch (op) {
    case "+": result = a + b; break;
    case "−": result = a - b; break;
    case "×": result = a * b; break;
    case "÷":
      if (b === 0) {
        triggerError("Error");  
        return null;
      }
      result = a / b;
      break;
    default:
      return null;
  }

   result = parseFloat(result.toPrecision(12));
   if (!isFinite(result)) {
    triggerError("Error");
    return null;
  }
  return result;
}

function handleEquals() {
  if (!state.operator || state.previousInput === "") return;
  const a = parseFloat(state.previousInput);
  const b = parseFloat(state.currentInput);
  updateExpression(`${formatDisplay(String(a))} ${state.operator} ${formatDisplay(String(b))} =`);
  const result = calculate(a, b, state.operator);
  if (result === null) return;
  updateDisplay(String(result), true);
  state.currentInput = String(result);
  state.previousInput = "";
  state.operator = null;
  state.shouldResetDisplay = true;
  state.justCalculated = true;
  highlightOperator(null);
}

function clearAll() {
  state.currentInput = "0";
  state.previousInput = "";
  state.operator = null;
  state.shouldResetDisplay = false;
  state.justCalculated = false;
  state.expression = "";

  updateDisplay("0");
  updateExpression("");
  highlightOperator(null);
}

function deleteLast() {
  if (state.shouldResetDisplay || state.justCalculated) return;

  if (state.currentInput.length > 1) {
    state.currentInput = state.currentInput.slice(0, -1);
  } else {
    state.currentInput = "0";
  }
  updateDisplay(state.currentInput);
}

function toggleSign() {
  const num = parseFloat(state.currentInput);
  if (isNaN(num) || num === 0) return;
  state.currentInput = String(num * -1);
  updateDisplay(state.currentInput);
}

function handlePercent() {
  const num = parseFloat(state.currentInput);
  if (isNaN(num)) return;
  state.currentInput = String(num / 100);
  updateDisplay(state.currentInput);
}

allButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.digit !== undefined) {
      inputDigit(button.dataset.digit);
      return;
    }

    if (button.dataset.operator !== undefined) {
      inputOperator(button.dataset.operator);
      return;
    }

    switch (button.dataset.action) {
      case "clear":    clearAll();    break;
      case "decimal":  inputDecimal(); break;
      case "equals":   handleEquals(); break;
      case "backspace": deleteLast(); break;
      case "sign":     toggleSign();  break;
      case "percent":  handlePercent(); break;
    }
  });
});

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^[0-9]$/.test(key)) {
    inputDigit(key);
    animateKey(`[data-digit="${key}"]`);
    return;
  }

  if (key === ".") {
    inputDecimal();
    animateKey('[data-action="decimal"]');
    return;
  }

  const opMap = {
    "+": "+",
    "-": "−",   
    "*": "×",
    "/": "÷",
  };
  if (opMap[key]) {
    event.preventDefault();
    inputOperator(opMap[key]);
    animateKey(`[data-operator="${opMap[key]}"]`);
    return;
  }

  if (key === "=" || key === "Enter") {
    event.preventDefault();
    handleEquals();
    animateKey('[data-action="equals"]');
    return;
  }

  if (key === "Backspace") {
    deleteLast();
    animateKey('[data-action="backspace"]');
    return;
  }

  if (key === "Escape") {
    clearAll();
    animateKey('[data-action="clear"]');
    return;
  }

  if (key === "%") {
    handlePercent();
    animateKey('[data-action="percent"]');
    return;
  }
});

function animateKey(selector) {
  const btn = document.querySelector(selector);
  if (!btn) return;
  btn.style.transform = "scale(0.92)";
  setTimeout(() => {
    btn.style.transform = "";
  }, 100);
}

(function init() {
  updateDisplay("0");
  updateExpression("");
})();
