import type { InputTypes } from "@/components/base/input/input.types";
import type { Message, PartialMessage } from "@bufbuild/protobuf";
import { has, keys, mapObjIndexed, not, values } from "ramda";
import { computed, reactive, ref } from "vue";

type DataType = Record<PropertyKey, any>;
type FunctionType = (...args: any[]) => Promise<any>;
type ResolvedType<T, TAction> = T extends Message<any> | DataType
  ? PartialMessage<T & Message<any>>
  : TAction extends DataType
  ? PartialMessage<TAction & Message<any>>
  : DataType;

export function useForm<
  T,
  Action extends FunctionType = never,
  TAction = Action extends never ? never : Parameters<Action>[0],
  Data extends ResolvedType<T, TAction> extends never
    ? any
    : ResolvedType<T, TAction> = ResolvedType<T, TAction>,
  SuccessHandler = Action extends never ? never : (response: TAction) => void,
  ErrorHandler = Action extends never ? never : (error: any) => void
>(
  data: Data,
  config?: {
    action?: Action;
    onSuccess?: SuccessHandler;
    onError?: ErrorHandler;
  }
) {
  const fields = keys(data);
  const ctx = reactive({
    data: data,
    error: mapObjIndexed(() => null, data),
    dirty: mapObjIndexed(() => false, data),
  }) as InputTypes.ContextType<Data>;

  const model = mapObjIndexed((_, key) => {
    const isFormModel = { value: true, configurable: false };
    const accessors = mapObjIndexed(
      (ctxField: any) => ({
        get: () => ctxField[key],
        set: (value: any) => (ctxField[key] = value),
        enumerable: true,
      }),
      ctx
    );
    return Object.defineProperties({}, { isFormModel, ...accessors });
  }, data) as InputTypes.ModelType<Data>;

  function hydrate(data: any) {
    if (typeof data === "object")
      fields.forEach((key) => {
        if (has(key as any, data)) (ctx.data as any)[key] = data[key];
      });
  }

  function reset() {
    fields.forEach((key) => {
      model[key].data = data[key];
      model[key].error = null;
      model[key].dirty = false;
    });
  }

  const isPending = ref(false);
  const isValid = computed(() => values(ctx.error).every(not));
  const isSubmittable = computed(() => isValid.value && !isPending.value);

  const hooks: { onSuccess?: SuccessHandler; onError?: ErrorHandler } = {};
  const onSuccess = (handler: SuccessHandler) => (hooks.onSuccess = handler);
  const onError = (handler: ErrorHandler) => (hooks.onError = handler);

  const submit = (async () => {
    const action = config?.action;
    if (!action) return;
    isPending.value = true;
    try {
      const response = await action(ctx.data);
      isPending.value = false;
      if (typeof hooks.onSuccess === "function") hooks.onSuccess(response);
      if (typeof config.onSuccess === "function") config.onSuccess(response);
      return response;
    } catch (error) {
      isPending.value = false;
      if (typeof hooks.onError === "function") hooks.onError(error);
      if (typeof config.onError === "function") config.onError(error);
      throw error;
    }
  }) as () => ReturnType<Action>;

  return reactive({
    ...ctx,
    model,
    reset,
    hydrate,
    submit,
    onSuccess,
    onError,
    isPending,
    isValid,
    isSubmittable,
  });
}