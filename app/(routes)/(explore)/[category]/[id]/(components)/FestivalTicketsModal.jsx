"use client";
import { useEffect, useMemo, useState } from "react";
import GlobalModal from "@/app/components/modals/GlobalModal";
import Button from "@/app/components/buttons/Button";
import SubmissionForm from "@/app/components/forms/SubmissionForm";

const createTier = () => ({ label: "", price: "", stock: true });

const createTicket = () => ({
  title: "",
  priceTiers: [createTier()],
  extraInfo: [],
});

const createGroup = () => ({
  title: "",
  tickets: [createTicket()],
});

const normalizeTier = (tier = {}) => ({
  label: tier?.label || "",
  price: tier?.price ?? "",
  stock: true,
});

const normalizeTicket = (ticket = {}) => ({
  ...createTicket(),
  ...ticket,
  priceTiers:
    Array.isArray(ticket?.priceTiers) && ticket.priceTiers.length
      ? ticket.priceTiers.map((tier) => normalizeTier(tier))
      : [createTier()],
});

const normalizeGroups = (rawGroups = []) => {
  if (!Array.isArray(rawGroups) || !rawGroups.length) return [createGroup()];

  return rawGroups.map((group) => ({
    ...createGroup(),
    ...group,
    tickets:
      Array.isArray(group?.tickets) && group.tickets.length
        ? group.tickets.map((ticket) => normalizeTicket(ticket))
        : [createTicket()],
  }));
};

const FestivalTicketsModal = ({ isOpen, onClose, festivalId, onSaved }) => {
  const [groups, setGroups] = useState([createGroup()]);
  const [ticketLink, setTicketLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return groups.some(
      (group) =>
        group.title.trim() &&
        group.tickets.some((ticket) => ticket.title.trim()),
    );
  }, [groups]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!isOpen || !festivalId) return;

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/festivals/tickets?festival_id=${festivalId}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load ticket data");
        }

        const json = await response.json();
        if (Array.isArray(json.ticket_groups) && json.ticket_groups.length) {
          setGroups(normalizeGroups(json.ticket_groups));
        } else {
          setGroups([createGroup()]);
        }
        setTicketLink(json?.ticket_link || "");
      } catch (err) {
        setError(err.message || "Failed to load ticket data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [festivalId, isOpen]);

  const updateGroup = (groupIndex, patch) => {
    setGroups((prev) =>
      prev.map((group, index) =>
        index === groupIndex ? { ...group, ...patch } : group,
      ),
    );
  };

  const updateTicket = (groupIndex, ticketIndex, patch) => {
    setGroups((prev) =>
      prev.map((group, index) => {
        if (index !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, idx) =>
            idx === ticketIndex ? { ...ticket, ...patch } : ticket,
          ),
        };
      }),
    );
  };

  const updateTier = (groupIndex, ticketIndex, tierIndex, patch) => {
    setGroups((prev) =>
      prev.map((group, gIndex) => {
        if (gIndex !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, tIndex) => {
            if (tIndex !== ticketIndex) return ticket;
            return {
              ...ticket,
              priceTiers: ticket.priceTiers.map((tier, pIndex) =>
                pIndex === tierIndex ? { ...tier, ...patch } : tier,
              ),
            };
          }),
        };
      }),
    );
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, createGroup()]);
  };

  const removeGroup = (groupIndex) => {
    setGroups((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, index) => index !== groupIndex);
    });
  };

  const addTicket = (groupIndex) => {
    setGroups((prev) =>
      prev.map((group, index) =>
        index === groupIndex
          ? { ...group, tickets: [...group.tickets, createTicket()] }
          : group,
      ),
    );
  };

  const removeTicket = (groupIndex, ticketIndex) => {
    setGroups((prev) =>
      prev.map((group, index) => {
        if (index !== groupIndex) return group;
        if (group.tickets.length === 1) return group;
        return {
          ...group,
          tickets: group.tickets.filter((_, idx) => idx !== ticketIndex),
        };
      }),
    );
  };

  const addTier = (groupIndex, ticketIndex) => {
    setGroups((prev) =>
      prev.map((group, gIndex) => {
        if (gIndex !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, tIndex) =>
            tIndex === ticketIndex
              ? { ...ticket, priceTiers: [...ticket.priceTiers, createTier()] }
              : ticket,
          ),
        };
      }),
    );
  };

  const removeTier = (groupIndex, ticketIndex, tierIndex) => {
    setGroups((prev) =>
      prev.map((group, gIndex) => {
        if (gIndex !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, tIndex) => {
            if (tIndex !== ticketIndex) return ticket;
            if (ticket.priceTiers.length === 1) return ticket;
            return {
              ...ticket,
              priceTiers: ticket.priceTiers.filter(
                (_, idx) => idx !== tierIndex,
              ),
            };
          }),
        };
      }),
    );
  };

  const addInfoRow = (groupIndex, ticketIndex) => {
    setGroups((prev) =>
      prev.map((group, gIndex) => {
        if (gIndex !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, tIndex) =>
            tIndex === ticketIndex
              ? { ...ticket, extraInfo: [...(ticket.extraInfo || []), ""] }
              : ticket,
          ),
        };
      }),
    );
  };

  const updateInfoRow = (groupIndex, ticketIndex, infoIndex, value) => {
    setGroups((prev) =>
      prev.map((group, gIndex) => {
        if (gIndex !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, tIndex) => {
            if (tIndex !== ticketIndex) return ticket;
            return {
              ...ticket,
              extraInfo: (ticket.extraInfo || []).map((row, idx) =>
                idx === infoIndex ? value : row,
              ),
            };
          }),
        };
      }),
    );
  };

  const removeInfoRow = (groupIndex, ticketIndex, infoIndex) => {
    setGroups((prev) =>
      prev.map((group, gIndex) => {
        if (gIndex !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, tIndex) => {
            if (tIndex !== ticketIndex) return ticket;
            return {
              ...ticket,
              extraInfo: (ticket.extraInfo || []).filter(
                (_, idx) => idx !== infoIndex,
              ),
            };
          }),
        };
      }),
    );
  };

  const handleSave = async () => {
    if (!festivalId) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/festivals/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          festival_id: festivalId,
          ticket_link: ticketLink,
          ticket_groups: groups,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save ticket info");
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to save ticket info");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Festival Ticket Info"
      maxWidth="max-w-5xl"
      onSubmit={handleSave}
      submitText="Save tickets"
      loading={isSaving}
      disabled={!canSubmit || isLoading}
    >
      <div className="space-y-4">
        {isLoading && (
          <p className="text-sm text-cream/80">Loading ticket data...</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!isLoading && (
          <SubmissionForm
            showGoogle={false}
            hideActions
            renderAs="div"
            formConfig={{
              initialData: { ticket_link: ticketLink || "" },
              fields: {
                ticket_link: {
                  type: "url",
                  label: "Ticket purchase link",
                  placeholder: "https://...",
                },
              },
              sections: [{ fields: ["ticket_link"] }],
            }}
            onDataChange={(data) => setTicketLink(data.ticket_link || "")}
          />
        )}

        {!isLoading &&
          groups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className=" bg-gold/5 rounded-xs p-3 space-y-3"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2">
                <SubmissionForm
                  showGoogle={false}
                  hideActions
                  renderAs="div"
                  className="space-y-0"
                  idPrefix={`group-${groupIndex}`}
                  formConfig={{
                    initialData: { title: group.title || "" },
                    fields: {
                      title: {
                        type: "text",
                        hideLabel: true,
                        placeholder:
                          "Section title (e.g. Regular Festival Tickets)",
                      },
                    },
                    sections: [{ fields: ["title"] }],
                  }}
                  onDataChange={(data) =>
                    updateGroup(groupIndex, { title: data.title || "" })
                  }
                />
                <Button
                  text="Remove section"
                  onClick={() => removeGroup(groupIndex)}
                  disabled={groups.length === 1}
                />
              </div>

              <div className="space-y-3">
                {(group.tickets || []).map((ticket, ticketIndex) => (
                  <div
                    key={ticketIndex}
                    className=" bg-stone-900 p-3 space-y-3"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2">
                      <SubmissionForm
                        showGoogle={false}
                        hideActions
                        renderAs="div"
                        className="space-y-0"
                        idPrefix={`ticket-${groupIndex}-${ticketIndex}`}
                        formConfig={{
                          initialData: { title: ticket.title || "" },
                          fields: {
                            title: {
                              type: "text",
                              hideLabel: true,
                              placeholder: "Ticket title (e.g. Friday Ticket)",
                            },
                          },
                          sections: [{ fields: ["title"] }],
                        }}
                        onDataChange={(data) =>
                          updateTicket(groupIndex, ticketIndex, {
                            title: data.title || "",
                          })
                        }
                      />

                      <Button
                        text="Remove ticket"
                        onClick={() => removeTicket(groupIndex, ticketIndex)}
                        disabled={(group.tickets || []).length === 1}
                      />
                    </div>

                    <div className="space-y-2 ">
                      <p className="text-xs uppercase text-cream/70">
                        Price tiers
                      </p>
                      {(ticket.priceTiers || []).map((tier, tierIndex) => (
                        <div
                          key={tierIndex}
                          className="grid grid-cols-1 xl:grid-cols-[1fr_auto] items-end gap-2"
                        >
                          <SubmissionForm
                            showGoogle={false}
                            hideActions
                            renderAs="div"
                            className="space-y-0"
                            idPrefix={`tier-${groupIndex}-${ticketIndex}-${tierIndex}`}
                            formConfig={{
                              initialData: {
                                label: tier.label || "",
                                price: tier.price ?? "",
                                stock: !Boolean(tier.stock),
                              },
                              fields: {
                                label: {
                                  type: "text",
                                  hideLabel: true,
                                  placeholder:
                                    "Ticket Tier Name (e.g early bird)",
                                },
                                price: {
                                  type: "number",
                                  hideLabel: true,
                                  placeholder: "Ticket Price",
                                  min: 0,
                                  step: "0.01",
                                },
                                stock: {
                                  type: "checkbox",
                                  label: "Sold out",
                                },
                              },
                              sections: [
                                {
                                  gridClass:
                                    "grid grid-cols-1 md:grid-cols-[1fr_180px_130px] gap-2 items-end",
                                  fields: ["label", "price", "stock"],
                                },
                              ],
                            }}
                            onDataChange={(data) =>
                              updateTier(groupIndex, ticketIndex, tierIndex, {
                                label: data.label || "",
                                price: data.price ?? "",
                                stock: !Boolean(data.stock),
                              })
                            }
                          />
                          <Button
                            text="Remove"
                            onClick={() =>
                              removeTier(groupIndex, ticketIndex, tierIndex)
                            }
                            disabled={(ticket.priceTiers || []).length === 1}
                          />
                        </div>
                      ))}

                      <Button
                        text="Add price tier"
                        onClick={() => addTier(groupIndex, ticketIndex)}
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase text-cream/70">
                        Additional info lines
                      </p>

                      {(ticket.extraInfo || []).map((row, infoIndex) => (
                        <div
                          key={infoIndex}
                          className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2"
                        >
                          <SubmissionForm
                            showGoogle={false}
                            hideActions
                            renderAs="div"
                            className="space-y-0"
                            idPrefix={`info-${groupIndex}-${ticketIndex}-${infoIndex}`}
                            formConfig={{
                              initialData: { info_line: row || "" },
                              fields: {
                                info_line: {
                                  type: "text",
                                  hideLabel: true,
                                  placeholder: "Info line",
                                },
                              },
                              sections: [{ fields: ["info_line"] }],
                            }}
                            onDataChange={(data) =>
                              updateInfoRow(
                                groupIndex,
                                ticketIndex,
                                infoIndex,
                                data.info_line || "",
                              )
                            }
                          />
                          <Button
                            text="Remove"
                            onClick={() =>
                              removeInfoRow(groupIndex, ticketIndex, infoIndex)
                            }
                          />
                        </div>
                      ))}

                      <Button
                        text="Add info line"
                        onClick={() => addInfoRow(groupIndex, ticketIndex)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button text="Add ticket" onClick={() => addTicket(groupIndex)} />
            </div>
          ))}

        {!isLoading && <Button text="Add section" onClick={addGroup} />}
      </div>
    </GlobalModal>
  );
};

export default FestivalTicketsModal;
