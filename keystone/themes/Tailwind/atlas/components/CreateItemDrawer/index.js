import { useKeystone, useList } from "@keystone/keystoneProvider";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { Drawer } from "../Modals";
import { Fields } from "../Fields";
import { GraphQLErrorNotice } from "../GraphQLErrorNotice";
import { LoadingIcon } from "../LoadingIcon";

export function CreateItemDrawer({ listKey, onClose, onCreate, trigger, isDrawerOpen, setIsDrawerOpen }) {
  const { createViewFieldModes } = useKeystone();
  const list = useList(listKey);
  const createItemState = useCreateItem(list);

  return (
    <Drawer
      title={`Create ${list.singular}`}
      isDrawerOpen={isDrawerOpen}
      setIsDrawerOpen={setIsDrawerOpen}
      trigger={trigger}
      actions={{
        confirm: {
          label: `Create ${list.singular}`,
          loading: createItemState.state === "loading",
          action: async () => {
            const item = await createItemState.create();
            if (!item) {
              throw new Error("Failed to create item"); // Throw an error if the item is not created
            }
            if (item) {
              onCreate({ id: item.id, label: item.label || item.id });
            }
          },
        },
        cancel: {
          label: "Cancel",
          action: () => {
            if (
              !createItemState.shouldPreventNavigation ||
              window.confirm(
                "There are unsaved changes, are you sure you want to exit?"
              )
            ) {
              onClose();
            }
          },
        },
      }}
    >
      {createViewFieldModes.state === "error" && (
        <GraphQLErrorNotice
          networkError={
            createViewFieldModes.error instanceof Error
              ? createViewFieldModes.error
              : undefined
          }
          errors={
            createViewFieldModes.error instanceof Error
              ? undefined
              : createViewFieldModes.error
          }
        />
      )}
      {createViewFieldModes.state === "loading" && (
        // <LoadingIcon label="Loading create form" />
        null
      )}
      {createItemState.error && (
        <GraphQLErrorNotice
          networkError={createItemState.error?.networkError}
          errors={createItemState.error?.graphQLErrors}
        />
      )}

      <Fields {...createItemState.props} />
    </Drawer>
  );
}
