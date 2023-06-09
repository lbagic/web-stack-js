import { css } from "@/utils/css";
import { modalProps } from "naive-ui";
import type { PropType } from "vue";

type ModalInstance = {
  show: () => void;
  hide: () => void;
};

export const baseModalProps = {
  ...modalProps,
  name: String,
  hash: String,
  query: String,
  routerAction: {
    type: String as PropType<"push" | "replace">,
    default: "replace",
  },
  maskColor: {
    type: String,
    default: css.color.primary["opaque-soft"],
  },
  onModalShow: { type: Function as PropType<() => any> },
  onModalHide: { type: Function as PropType<() => any> },
};

export const modalController: Record<string, ModalInstance> = {};

export const modalInternals = {
  register(name: string, modal: ModalInstance) {
    modalController[name] = modal;
  },
  destroy(name: string) {
    delete modalController[name];
  },
};
