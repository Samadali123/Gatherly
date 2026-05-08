export const emojiPickerSize = {
  width: 352,
  height: 435,
  gap: 8,
  margin: 12,
};

export const getEmojiPickerPosition = ({
  boundaryRect = null,
  triggerRect,
  viewportWidth,
  viewportHeight,
  pickerWidth = emojiPickerSize.width,
  pickerHeight = emojiPickerSize.height,
  gap = emojiPickerSize.gap,
  horizontalOffset = 0,
  margin = emojiPickerSize.margin,
}) => {
  const boundary = boundaryRect || {
    left: 0,
    right: viewportWidth,
    top: 0,
    bottom: viewportHeight,
  };
  const availableAbove = triggerRect.top - boundary.top;
  const requiredAbove = pickerHeight >= 350 ? 350 : pickerHeight + gap + margin;
  const placement = availableAbove < requiredAbove ? 'bottom' : 'top';
  const centeredLeft = triggerRect.left + (triggerRect.right - triggerRect.left) / 2 - pickerWidth / 2 + horizontalOffset;
  const minLeft = boundary.left + margin;
  const maxLeft = Math.max(minLeft, boundary.right - pickerWidth - margin);
  const left = Math.min(Math.max(centeredLeft, minLeft), maxLeft);
  const preferredTop = placement === 'top' ? triggerRect.top - pickerHeight - gap : triggerRect.bottom + gap;
  const minTop = boundary.top + margin;
  const maxTop = Math.max(minTop, boundary.bottom - pickerHeight - margin);
  const top = Math.min(Math.max(preferredTop, minTop), maxTop);

  return {
    left: Math.round(left),
    placement,
    top: Math.round(top),
  };
};
