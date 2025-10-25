import { useState, useEffect } from 'react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 3000;

const toastTimeouts = new Map();

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const toastState = {
  toasts: [],
  listeners: new Set()
};

function addToRemoveQueue(toastId) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

function dispatch(action) {
  switch (action.type) {
    case 'ADD_TOAST':
      toastState.toasts = [action.toast, ...toastState.toasts].slice(0, TOAST_LIMIT);
      break;
    case 'UPDATE_TOAST':
      toastState.toasts = toastState.toasts.map((t) =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      );
      break;
    case 'DISMISS_TOAST':
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        toastState.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      toastState.toasts = toastState.toasts.map((t) =>
        t.id === toastId || toastId === undefined
          ? {
              ...t,
              open: false
            }
          : t
      );
      break;
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        toastState.toasts = [];
      } else {
        toastState.toasts = toastState.toasts.filter((t) => t.id !== action.toastId);
      }
      break;
  }

  toastState.listeners.forEach((listener) => {
    listener(toastState.toasts);
  });
}

export function toast({ ...props }) {
  const id = genId();

  const update = (props) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id }
    });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      }
    }
  });

  return {
    id: id,
    dismiss,
    update
  };
}

export function useToast() {
  const [state, setState] = useState(toastState.toasts);

  useEffect(() => {
    const listener = (toasts) => {
      setState(toasts);
    };

    toastState.listeners.add(listener);

    return () => {
      toastState.listeners.delete(listener);
    };
  }, []);

  return {
    toast,
    toasts: state,
    dismiss: (toastId) => dispatch({ type: 'DISMISS_TOAST', toastId })
  };
}
