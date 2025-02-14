import React, { useState, useMemo, useEffect } from "react";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { gql, useMutation, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { useList } from "@keystone/keystoneProvider";
import {
  ArrowRight,
  Edit,
  Edit2,
  ListFilter,
  Plus,
  Trash2,
  XIcon,
} from "lucide-react";
import { Button } from "@ui/button";
import { Badge } from "@ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/popover";
import { Label } from "@ui/label";
import { useToasts } from "@keystone/screens";
import { cn } from "@keystone/utils/cn";
import { ReactSortable } from "react-sortablejs";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { RiFilterLine } from "@remixicon/react";

const GET_CHANNELS = gql`
  query GetChannels($where: ChannelWhereInput, $take: Int, $skip: Int) {
    items: channels(where: $where, take: $take, skip: $skip) {
      id
      name
    }
  }
`;

export const CreateLinkButton = ({ channelId, refetch }) => {
  const list = useList("Link");
  const { createWithData, state, error } = useCreateItem(list);
  const {
    data,
    loading,
    error: queryError,
  } = useQuery(GET_CHANNELS, {
    variables: { where: {}, take: 50, skip: 0 },
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateLink = async (channelId) => {
    setIsCreating(true);
    try {
      const item = await createWithData({
        data: {
          channel: { connect: { id: channelId } },
          channel: { connect: { id: channelId } },
        },
      });
      if (item) {
        refetch();
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <Button
            variant="secondary"
            size="icon"
            className="border [&_svg]:size-2.5 h-5 w-5"
            disabled={isCreating}
            isLoading={isCreating}
          >
            <Plus />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Select Channel to Link</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {loading && <DropdownMenuItem>Loading...</DropdownMenuItem>}
          {queryError && (
            <DropdownMenuItem>Error loading channels</DropdownMenuItem>
          )}
          {data?.items?.map((channel) => (
            <DropdownMenuItem
              key={channel.id}
              onClick={() => handleCreateLink(channel.id)}
              disabled={isCreating}
            >
              {channel.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const areOrdersEqual = (links1, links2) => {
  if (links1.length !== links2.length) return false;
  return links1.every((link, index) => link.id === links2[index].id);
};

export const Links = ({
  channelId,
  links: initialLinks,
  refetch,
  isLoading,
  editItem,
}) => {
  const [links, setLinks] = useState([]);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingFilter, setIsDeletingFilter] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [error, setError] = useState(null);

  const hasOrderChanged = !areOrdersEqual(initialLinks, links);

  const updateMutation = gql`
    mutation ($data: LinkUpdateInput!, $id: ID!) {
      item: updateLink(where: { id: $id }, data: $data) {
        id
        filters
      }
    }
  `;
  const [update] = useMutation(updateMutation);

  const updateLinksMutation = gql`
    mutation UpdateLinks($data: [LinkUpdateArgs!]!) {
      updateLinks(data: $data) {
        id
        rank
      }
    }
  `;
  const [updateLinks] = useMutation(updateLinksMutation);

  const deleteMutation = gql`
    mutation ($id: ID!) {
      deleteLink(where: { id: $id }) {
        id
      }
    }
  `;
  const [deleteLink] = useMutation(deleteMutation);

  const toasts = useToasts();
  const list = useList("Order");

  useEffect(() => {
    const simplifiedLinks = initialLinks.map((link) => ({
      id: link.id,
      name: link.channel ? link.channel.name : "Unnamed",
      filtersCount: link.filters?.length || 0,
      rank: link.rank,
      filters: link.filters || [],
    }));
    setLinks(simplifiedLinks);
  }, [initialLinks]);

  const handleFilterSubmit = (state) => {
    setIsUpdating(true);
    setError(null);
    const selectedLink = links.find((link) => link.id === selectedLinkId);
    const updatedFilters = [...(selectedLink.filters || [])];

    const existingFilterIndex = updatedFilters.findIndex(
      (filter) =>
        filter.field === state.fieldPath && filter.type === state.filterType
    );

    if (existingFilterIndex !== -1) {
      updatedFilters[existingFilterIndex] = {
        type: state.filterType,
        field: state.fieldPath,
        value: state.filterValue,
      };
    } else {
      updatedFilters.push({
        type: state.filterType,
        field: state.fieldPath,
        value: state.filterValue,
      });
    }

    update({
      variables: { data: { filters: updatedFilters }, id: selectedLinkId },
    })
      .then((result) => {
        const updatedLink = result.data.item;
        setLinks((prevLinks) =>
          prevLinks.map((link) =>
            link.id === updatedLink.id
              ? {
                  ...link,
                  filters: updatedLink.filters,
                  filtersCount: updatedLink.filters.length,
                }
              : link
          )
        );
        toasts.addToast({
          tone: "positive",
          title: "Filters updated successfully",
        });
        setIsPopoverOpen(false);
      })
      .catch((err) => {
        setError(err.message);
        toasts.addToast({
          title: "Failed to update filters",
          tone: "negative",
          message: err.message,
        });
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const deleteFilter = (linkId, field, type) => {
    setIsDeletingFilter(true);
    setError(null);
    const link = links.find((link) => link.id === linkId);
    if (!link || !link.filters) {
      setError("Link or filters not found");
      setIsDeletingFilter(false);
      return;
    }
    const updatedFilters = link.filters.filter(
      (filter) => !(filter.field === field && filter.type === type)
    );

    update({
      variables: { data: { filters: updatedFilters }, id: linkId },
    })
      .then((result) => {
        const updatedLink = result.data.item;
        setLinks((prevLinks) =>
          prevLinks.map((link) =>
            link.id === updatedLink.id
              ? {
                  ...link,
                  filters: updatedLink.filters,
                  filtersCount: updatedLink.filters.length,
                }
              : link
          )
        );
        toasts.addToast({
          tone: "positive",
          title: "Filter deleted successfully",
        });
      })
      .catch((err) => {
        setError(err.message);
        toasts.addToast({
          title: "Failed to delete filter",
          tone: "negative",
          message: err.message,
        });
      })
      .finally(() => {
        setIsDeletingFilter(false);
      });
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await deleteLink({ variables: { id: linkId } });
      setLinks(links.filter((link) => link.id !== linkId));
      toasts.addToast({
        tone: "positive",
        title: "Link deleted successfully",
      });
    } catch (err) {
      setError(err.message);
      toasts.addToast({
        title: "Failed to delete link",
        tone: "negative",
        message: err.message,
      });
    }
  };

  const handleSaveOrder = async () => {
    setIsUpdating(true);
    try {
      const updateData = links.map((link, index) => ({
        where: { id: link.id },
        data: { rank: index + 1 },
      }));

      await updateLinks({ variables: { data: updateData } });

      toasts.addToast({
        tone: "positive",
        title: "Link order updated successfully",
      });
      refetch();
    } catch (err) {
      setError(err.message);
      toasts.addToast({
        title: "Failed to update link order",
        tone: "negative",
        message: err.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div>Loading links...</div>;
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-4">
      {error && <div className="text-red-500 col-span-full">{error}</div>}
      <div className="flex flex-col gap-3">
        <div className="shadow-sm p-3 bg-muted text-muted-foreground rounded-lg border flex flex-col">
          <div className="flex justify-between">
            <div className="flex flex-col gap-0.5">
              <Label className="text-base">Links</Label>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Create links to channels based on filters
              </div>
            </div>
            {/* {JSON.stringify({ initialLinks })} */}
            {hasOrderChanged ? (
              <Button
                variant="secondary"
                className="flex items-center text-xs gap-3 h-5 px-1.5"
                onClick={handleSaveOrder}
                disabled={isUpdating}
                isLoading={isUpdating}
              >
                Save
              </Button>
            ) : (
              <CreateLinkButton channelId={channelId} refetch={refetch} />
            )}
          </div>
          {/* <ReactSortable list={state} setList={setState}>
            {state.map((item) => (
              <div key={item.id}>{item.name}</div>
            ))}
          </ReactSortable> */}
          {links.length > 0 && (
            <ReactSortable
              list={links}
              setList={setLinks}
              // setList={(newState) => handleLinkOrderChange(newState)}
              className="flex flex-col mt-3 gap-2"
            >
              {links.map((link) => (
                <Link
                  key={link.id}
                  link={link}
                  isSelected={selectedLinkId === link.id}
                  onSelect={() => setSelectedLinkId(link.id)}
                  // onDelete={() => handleDeleteLink(link.id)}
                  editItem={() => editItem(link.id, "Link")}
                />
              ))}
            </ReactSortable>
          )}
        </div>
      </div>

      {selectedLinkId && (
        <div>
          <div className="shadow-sm p-3 bg-muted text-muted-foreground rounded-lg border flex flex-col">
            <div className="flex justify-between">
              <div className="flex flex-col gap-1">
                <Label className="text-base">Filters</Label>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Orders matching these filters will be processed by this
                  channel
                </div>
              </div>
              <div>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="border [&_svg]:size-2.5 h-5 w-5"
                    >
                      <Plus />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="right">
                    <AddFilterContent
                      list={list}
                      listKey="Order"
                      handleFilterSubmit={handleFilterSubmit}
                      isUpdating={isUpdating}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <FilterList
              filters={
                initialLinks.find((link) => link.id === selectedLinkId).filters
              }
              list={list}
              linkId={selectedLinkId}
              deleteFilter={deleteFilter}
              handleFilterSubmit={handleFilterSubmit}
              isUpdating={isUpdating}
              isDeletingFilter={isDeletingFilter}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const Link = ({ link, isSelected, onSelect, editItem }) => {
  return (
    <div className="bg-background border rounded-lg flex justify-between p-2 tracking-wide font-medium">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Badge
            color="zinc"
            className="border rounded-md py-1 px-1.5 text-[.7rem]/3 flex gap-1 items-center"
          >
            {link.rank}
          </Badge>
          {link.name}
        </div>
        <div className="flex items-center gap-1">
          <Badge
            color="teal"
            className="cursor-pointer opacity-50 hover:opacity-100 ml-2 border rounded-md p-1 text-[.7rem]/3 flex gap-1 items-center"
            onClick={editItem}
          >
            <Pencil1Icon className="w-3 h-3" />
          </Badge>
          <Badge
            color="blue"
            className={cn(
              "cursor-pointer opacity-50 hover:opacity-100 border rounded-md py-1 px-1.5 tracking-wide font-medium text-[.7rem]/3 flex gap-1 items-center",
              isSelected && "opacity-100"
            )}
            onClick={onSelect}
          >
            {link.filtersCount || 0} <ListFilter className="w-3 h-3" />
          </Badge>
        </div>
      </div>
    </div>
  );
};

function FilterList({
  filters,
  list,
  linkId,
  deleteFilter,
  handleFilterSubmit,
  isUpdating,
  isDeletingFilter,
}) {
  return (
    <div className="flex flex-col gap-2">
      {filters?.map((filter, index) => (
        <FilterPill
          key={index}
          filter={filter}
          field={list.fields[filter.field]}
          linkId={linkId}
          deleteFilter={deleteFilter}
          handleFilterSubmit={handleFilterSubmit}
          isUpdating={isUpdating}
          isDeletingFilter={isDeletingFilter}
          list={list}
        />
      ))}
    </div>
  );
}

function FilterPill({
  filter,
  field,
  linkId,
  deleteFilter,
  handleFilterSubmit,
  isUpdating,
  isDeletingFilter,
  list,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const onRemove = () => {
    deleteFilter(linkId, filter.field, filter.type);
  };

  const filterType = field.controller.filter.types[filter.type];
  const filterLabel = filterType ? filterType.label : filter.type;

  const formattedValue = field.controller.filter.format
    ? field.controller.filter.format({
        label: filterLabel,
        type: filter.type,
        value: filter.value,
      })
    : `${filterLabel} ${filter.value}`;

  const readableFilter = `${field.label} ${formattedValue}`;

  const handleSubmit = async (state) => {
    await handleFilterSubmit(state);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="first:mt-3 bg-background border rounded-lg flex justify-between items-center py-2 pr-2 pl-3 cursor-pointer">
          {readableFilter}
          <div>
            <Badge
              color="red"
              className="ml-2 border rounded-md p-1 text-[.7rem]/3 flex gap-1 items-center"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              disabled={isDeletingFilter}
            >
              <XIcon className="w-3 h-3" />
            </Badge>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent side="right">
        <UpdateFilterContent
          list={list}
          filter={filter}
          field={field}
          handleFilterSubmit={handleSubmit}
          isUpdating={isUpdating}
        />
      </PopoverContent>
    </Popover>
  );
}

function AddFilterContent({ list, listKey, handleFilterSubmit, isUpdating }) {
  const [state, setState] = useState({
    fieldPath: null,
    filterType: null,
    filterValue: null,
  });

  const fieldsWithFilters = useMemo(() => {
    const fieldsWithFilters = {};
    Object.keys(list.fields).forEach((fieldPath) => {
      const field = list.fields[fieldPath];
      if (field.controller.filter) {
        fieldsWithFilters[fieldPath] = field;
      }
    });
    return fieldsWithFilters;
  }, [list.fields]);

  const handleSelectFieldPath = (fieldPath) => {
    setState({
      fieldPath,
      filterType: null,
      filterValue: null,
    });
  };

  const handleSelectFilterType = (filterType) => {
    setState((prevState) => ({
      ...prevState,
      filterType,
      filterValue:
        fieldsWithFilters[prevState.fieldPath]?.controller.filter.types[
          filterType
        ]?.initialValue ?? null,
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="space-y-1">
          <Label>Field</Label>
          <Select value={state.fieldPath} onValueChange={handleSelectFieldPath}>
            <SelectTrigger className="text-base bg-muted/40 w-full">
              <SelectValue placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(fieldsWithFilters).map((fieldPath) => (
                <SelectItem key={fieldPath} value={fieldPath}>
                  {list.fields[fieldPath]?.label ?? fieldPath}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {state.fieldPath && (
          <div className="space-y-1">
            <Label>Condition</Label>
            <Select
              value={state.filterType}
              onValueChange={handleSelectFilterType}
            >
              <SelectTrigger className="text-base bg-muted/40 w-full">
                <SelectValue placeholder="Select a condition" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(
                  fieldsWithFilters[state.fieldPath].controller.filter.types
                ).map(([filterType, { label }]) => (
                  <SelectItem key={filterType} value={filterType}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {state.fieldPath &&
          state.filterType &&
          fieldsWithFilters[state.fieldPath] &&
          (() => {
            const { Filter } =
              fieldsWithFilters[state.fieldPath].controller.filter;
            if (Filter)
              return (
                <div className="space-y-1">
                  <Label>Value</Label>
                  <Filter
                    type={state.filterType}
                    value={state.filterValue}
                    placeholder="Enter value"
                    onChange={(value) => {
                      setState((state) => ({
                        ...state,
                        filterValue: value,
                      }));
                    }}
                  />
                </div>
              );
          })()}
      </div>
      <Button
        onClick={() => handleFilterSubmit(state)}
        disabled={
          isUpdating ||
          !state.fieldPath ||
          !state.filterType ||
          state.filterValue === null
        }
        isLoading={isUpdating}
        className="self-end"
      >
        {isUpdating ? "Adding..." : "Add Filter"}
      </Button>
    </div>
  );
}

function UpdateFilterContent({ list, filter, handleFilterSubmit, isUpdating }) {
  const [state, setState] = useState({
    fieldPath: filter.field,
    filterType: filter.type,
    filterValue: filter.value,
  });

  const fieldsWithFilters = useMemo(() => {
    const fieldsWithFilters = {};
    Object.keys(list.fields).forEach((fieldPath) => {
      const field = list.fields[fieldPath];
      if (field.controller.filter) {
        fieldsWithFilters[fieldPath] = field;
      }
    });
    return fieldsWithFilters;
  }, [list.fields]);

  const handleSelectFieldPath = (fieldPath) => {
    setState({
      fieldPath,
      filterType: null,
      filterValue: null,
    });
  };

  const handleSelectFilterType = (filterType) => {
    setState((prevState) => ({
      ...prevState,
      filterType,
      filterValue:
        fieldsWithFilters[prevState.fieldPath]?.controller.filter.types[
          filterType
        ]?.initialValue ?? null,
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="space-y-1">
          <Label>Field</Label>
          <Select value={state.fieldPath} onValueChange={handleSelectFieldPath}>
            <SelectTrigger className="text-base bg-muted/40 w-full">
              <SelectValue placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(fieldsWithFilters).map((fieldPath) => (
                <SelectItem key={fieldPath} value={fieldPath}>
                  {list.fields[fieldPath]?.label ?? fieldPath}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {state.fieldPath && (
          <div className="space-y-1">
            <Label>Condition</Label>
            <Select
              value={state.filterType}
              onValueChange={handleSelectFilterType}
            >
              <SelectTrigger className="text-base bg-muted/40 w-full">
                <SelectValue placeholder="Select a condition" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(
                  fieldsWithFilters[state.fieldPath].controller.filter.types
                ).map(([filterType, { label }]) => (
                  <SelectItem key={filterType} value={filterType}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {state.fieldPath &&
          state.filterType &&
          fieldsWithFilters[state.fieldPath] &&
          (() => {
            const { Filter } =
              fieldsWithFilters[state.fieldPath].controller.filter;
            if (Filter)
              return (
                <div className="space-y-1">
                  <Label>Value</Label>
                  <Filter
                    type={state.filterType}
                    value={state.filterValue}
                    placeholder="Enter value"
                    onChange={(value) => {
                      setState((state) => ({
                        ...state,
                        filterValue: value,
                      }));
                    }}
                  />
                </div>
              );
          })()}
      </div>
      <Button
        onClick={() => handleFilterSubmit(state)}
        disabled={
          isUpdating ||
          !state.fieldPath ||
          !state.filterType ||
          state.filterValue === null
        }
        isLoading={isUpdating}
        className="self-end"
      >
        {isUpdating ? "Updating..." : "Update Filter"}
      </Button>
    </div>
  );
}
