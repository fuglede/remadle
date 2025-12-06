/*
Copyright (c) 2023 by Wade Williams (https://codepen.io/559wade/pen/LRzEjj)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

$("input[data-type='currency']").on({
  keyup: function () {
    formatCurrency($(this));
  },
  blur: function () {
    formatCurrency($(this), "blur");
  },
});

function formatNumber(n) {
  // format number 1000000 to 1.234.567 (Danish format with dots as thousand separators)
  return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatCurrency(input, blur) {
  // formats number with dots for thousands and keeps commas as decimal separators for display
  // only converts commas to periods internally when processing

  // get input value
  var input_val = input.val();

  // don't validate empty input
  if (input_val === "") {
    return;
  }

  // Keep the original decimal separator (comma or period) for display
  var hasCommaDecimal = input_val.indexOf(",") >= 0;
  var hasPeriodDecimal = input_val.indexOf(".") >= 0;
  
  // For processing, temporarily convert comma to period
  var processing_val = input_val.replace(",", ".");

  // original length
  var original_len = input_val.length;

  // initial caret position
  var caret_pos = input.prop("selectionStart");

  // check for decimal (period - after converting comma if needed)
  if (processing_val.indexOf(".") >= 0) {
    // get position of first decimal period
    // this prevents multiple decimals from
    // being entered
    var decimal_pos = processing_val.indexOf(".");

    // split number by decimal period
    var left_side = processing_val.substring(0, decimal_pos);
    var right_side = processing_val.substring(decimal_pos + 1);

    // add dots to left side of number (thousand separators)
    left_side = formatNumber(left_side);

    // validate right side
    right_side = formatNumber(right_side);

    // On blur make sure 2 numbers after decimal
    if (blur === "blur") {
      right_side += "00";
    }

    // Limit decimal to only 2 digits
    right_side = right_side.substring(0, 2);

    // For display, use comma as decimal separator (Danish style)
    // unless the user specifically typed a period
    var decimal_separator = hasCommaDecimal || (!hasPeriodDecimal && !blur) ? "," : ",";
    if (blur === "blur") {
      decimal_separator = ","; // Always use comma for Danish formatting
    }
    
    input_val = left_side + decimal_separator + right_side;
  } else {
    // no decimal entered
    // add dots to number (thousand separators)
    // remove all non-digits
    input_val = formatNumber(processing_val);

    // final formatting
    if (blur === "blur") {
      input_val = input_val + ",00";
    }
  }

  // send updated string to input
  input.val(input_val);

  // put caret back in the right position
  var updated_len = input_val.length;
  caret_pos = updated_len - original_len + caret_pos;
  input[0].setSelectionRange(caret_pos, caret_pos);
}
