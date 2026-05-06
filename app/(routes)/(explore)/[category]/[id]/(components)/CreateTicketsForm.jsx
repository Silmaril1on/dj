"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import Button from "@/app/components/buttons/Button";
import Spinner from "@/app/components/ui/Spinner";
import SectionContainer from "@/app/components/containers/SectionContainer";
import SubmissionForm from "@/app/components/forms/SubmissionForm";

// ─── formConfig factories ─────────────────────────────────────────────────────

const buildTicketLinkFormConfig = (initialData) => ({
  initialData,
  fields: {
    ticket_link: {
      type: "url",
      label: "External Ticket Link",
      helpText:
        "Link to the platform where attendees buy tickets (e.g. Ticketmaster, Eventbrite). Leave empty if tickets are managed manually.",
      placeholder: "https://...",
    },
  },
  sections: [{ fields: ["ticket_link"], gridClass: "grid grid-cols-1 gap-1" }],
});

const buildGroupFormConfig = (initialData) => ({
  initialData,
  fields: {
    title: {
      type: "text",
      label: "Group Title",
      helpText: "Separates ticket phases or categories — e.g. Regular, VIP",
      placeholder: "REGULAR / VIP Admission",
      required: true,
    },
  },
  sections: [{ fields: ["title"], gridClass: "grid grid-cols-1 gap-1" }],
});

const buildTicketFormConfig = (initialData) => ({
  initialData,
  arrayFields: ["extraInfo"],
  fields: {
    title: {
      type: "text",
      label: "Ticket Name",
      helpText:
        "Display name buyers will see - e.g. Single Day Pass, Weekend Pass, Early Bird",
      placeholder: "General Admission",
      required: true,
    },
    ticket_info: {
      type: "textarea",
      label: "Short Description",
      helpText: "Optional - what this ticket includes or any notes for buyers",
      placeholder: "Includes access to all stages",
    },
    extraInfo: {
      type: "additional",
      label: "Extra Info",
      helpText: "Bullet points shown on the ticket listing",
      placeholder: "e.g. Free parking included",
    },
  },
  sections: [
    {
      fields: ["title", "ticket_info", "extraInfo"],
      gridClass: "grid grid-cols-1 gap-4",
    },
  ],
});

const buildTierFormConfig = (initialData) => ({
  initialData,
  fields: {
    label: {
      type: "text",
      label: "Tier Label",
      helpText: "Sales phase name shown to buyers - e.g. Phase 1, Phase 2",
      placeholder: "Phase 1",
      required: true,
    },
    price: {
      type: "number",
      label: "Price (EUR)",
      helpText: "Use 0 for free tickets",
      placeholder: "0.00",
      min: 0,
      step: "0.01",
    },
    count: {
      type: "number",
      label: "Ticket Count",
      helpText: "How many tickets available at this tier",
      placeholder: "e.g. 500",
      min: 0,
      step: "1",
    },
    stock: {
      type: "checkbox",
      label: "In stock - this tier is currently available for purchase",
    },
  },
  sections: [
    {
      fields: ["label", "price", "count"],
      gridClass: "grid grid-cols-3 gap-3",
    },
    {
      fields: ["stock"],
      gridClass: "grid grid-cols-1 pt-1",
    },
  ],
});

// ─── data factories ───────────────────────────────────────────────────────────

const createTier = () => ({ label: "", price: "", count: "", stock: true });

const createTicket = () => ({
  title: "",
  ticket_info: "",
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
  count: tier?.count ?? "",
  stock: tier?.stock !== false,
});

const normalizeTicket = (ticket = {}) => ({
  ...createTicket(),
  ...ticket,
  ticket_info: ticket?.ticket_info || "",
  priceTiers:
    Array.isArray(ticket?.priceTiers) && ticket.priceTiers.length
      ? ticket.priceTiers.map(normalizeTier)
      : [createTier()],
});

const normalizeGroups = (rawGroups = []) => {
  if (!Array.isArray(rawGroups) || !rawGroups.length) return [createGroup()];
  return rawGroups.map((group) => ({
    ...createGroup(),
    ...group,
    tickets:
      Array.isArray(group?.tickets) && group.tickets.length
        ? group.tickets.map(normalizeTicket)
        : [createTicket()],
  }));
};

// ─── component ────────────────────────────────────────────────────────────────

const CreateTicketsForm = ({ entityId, entityType, entityName, backHref }) => {
  const router = useRouter();

  const apiGet =
    entityType === "event"
      ? `/api/events/tickets?event_id=${entityId}`
      : `/api/festivals/tickets?festival_id=${entityId}`;

  const apiPost =
    entityType === "event" ? "/api/events/tickets" : "/api/festivals/tickets";

  const bodyKey = entityType === "event" ? "event_id" : "festival_id";

  const [groups, setGroups] = useState([createGroup()]);
  const [ticketLink, setTicketLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(apiGet, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load ticket data");
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
    if (entityId) fetchTickets();
  }, [entityId, apiGet]);

  const canSubmit = useMemo(
    () =>
      groups.some(
        (group) =>
          group.title.trim() &&
          group.tickets.some((ticket) => ticket.title.trim()),
      ),
    [groups],
  );

  // ─── mutators ───────────────────────────────────────────────────────────────

  const updateGroup = (groupIndex, patch) =>
    setGroups((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, ...patch } : g)),
    );

  const updateTicket = (groupIndex, ticketIndex, patch) =>
    setGroups((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((t, j) =>
            j === ticketIndex ? { ...t, ...patch } : t,
          ),
        };
      }),
    );

  const updateTier = (groupIndex, ticketIndex, tierIndex, patch) =>
    setGroups((prev) =>
      prev.map((group, gi) => {
        if (gi !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, ti) => {
            if (ti !== ticketIndex) return ticket;
            return {
              ...ticket,
              priceTiers: ticket.priceTiers.map((tier, pi) =>
                pi === tierIndex ? { ...tier, ...patch } : tier,
              ),
            };
          }),
        };
      }),
    );

  const addGroup = () => setGroups((prev) => [...prev, createGroup()]);

  const removeGroup = (groupIndex) =>
    setGroups((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== groupIndex),
    );

  const addTicket = (groupIndex) =>
    setGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? { ...group, tickets: [...group.tickets, createTicket()] }
          : group,
      ),
    );

  const removeTicket = (groupIndex, ticketIndex) =>
    setGroups((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        if (group.tickets.length === 1) return group;
        return {
          ...group,
          tickets: group.tickets.filter((_, j) => j !== ticketIndex),
        };
      }),
    );

  const addTier = (groupIndex, ticketIndex) =>
    setGroups((prev) =>
      prev.map((group, gi) => {
        if (gi !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, ti) =>
            ti === ticketIndex
              ? { ...ticket, priceTiers: [...ticket.priceTiers, createTier()] }
              : ticket,
          ),
        };
      }),
    );

  const removeTier = (groupIndex, ticketIndex, tierIndex) =>
    setGroups((prev) =>
      prev.map((group, gi) => {
        if (gi !== groupIndex) return group;
        return {
          ...group,
          tickets: group.tickets.map((ticket, ti) => {
            if (ti !== ticketIndex) return ticket;
            if (ticket.priceTiers.length === 1) return ticket;
            return {
              ...ticket,
              priceTiers: ticket.priceTiers.filter((_, pi) => pi !== tierIndex),
            };
          }),
        };
      }),
    );

  // ─── save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const response = await fetch(apiPost, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [bodyKey]: entityId,
          ticket_link: ticketLink,
          ticket_groups: groups,
        }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save tickets");
      }
      setSuccessMsg("Tickets saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save tickets");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── grid helpers ─────────────────────────────────────────────────────────────

  const emptySlotsCount = groups.length % 3 === 0 ? 0 : 3 - (groups.length % 3);
  const showAddGroupBelow = groups.length % 3 === 0;

  // ─── render ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <SectionContainer
      title={`${entityName} - Ticket Info`}
      description={`Manage ticket information for this ${entityType}.`}
    >
      <div className="w-full space-y-6">
        <Button
          text="← Back"
          size="small"
          onClick={() => router.push(backHref)}
        />

        {error && (
          <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/30 px-3 py-2 secondary">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/30 px-3 py-2 secondary">
            {successMsg}
          </p>
        )}

        {/* External ticket link */}
        <SubmissionForm
          renderAs="div"
          hideActions={true}
          formConfig={buildTicketLinkFormConfig({ ticket_link: ticketLink })}
          onDataChange={(data) => setTicketLink(data.ticket_link || "")}
          onSubmit={() => {}}
        />

        {/* Groups — grid-cols-3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {groups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="border relative border-gold/20 bg-stone-950 p-4 space-y-5"
            >
              {/* Group title */}
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <SubmissionForm
                    renderAs="div"
                    hideActions={true}
                    formConfig={buildGroupFormConfig({ title: group.title })}
                    onDataChange={(data) => updateGroup(groupIndex, data)}
                    onSubmit={() => {}}
                    idPrefix={`g${groupIndex}`}
                  />
                </div>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGroup(groupIndex)}
                    className=" text-red-400 text-xs hover:text-red-300 shrink-0 absolute top-2 right-2"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Tickets */}
              <div className="space-y-4">
                {group.tickets.map((ticket, ticketIndex) => (
                  <div
                    key={ticketIndex}
                    className="border border-gold/10 bg-stone-900 p-3 space-y-4"
                  >
                    {/* Ticket fields (name, description, extra info) */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <SubmissionForm
                          renderAs="div"
                          hideActions={true}
                          formConfig={buildTicketFormConfig({
                            title: ticket.title,
                            ticket_info: ticket.ticket_info,
                            extraInfo: ticket.extraInfo?.length
                              ? ticket.extraInfo
                              : [],
                          })}
                          onDataChange={(data) =>
                            updateTicket(groupIndex, ticketIndex, data)
                          }
                          onSubmit={() => {}}
                          idPrefix={`g${groupIndex}t${ticketIndex}`}
                        />
                      </div>
                      {group.tickets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicket(groupIndex, ticketIndex)}
                          className="mt-7 text-red-400 text-xs hover:text-red-300 shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Price tiers */}
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-wider text-chino/70 secondary">
                        Price Tiers
                      </p>
                      {ticket.priceTiers.map((tier, tierIndex) => (
                        <div
                          key={tierIndex}
                          className="border border-gold/10 bg-stone-800 p-3"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <SubmissionForm
                                renderAs="div"
                                hideActions={true}
                                formConfig={buildTierFormConfig({
                                  label: tier.label,
                                  price: tier.price,
                                  count: tier.count,
                                  stock: tier.stock,
                                })}
                                onDataChange={(data) =>
                                  updateTier(
                                    groupIndex,
                                    ticketIndex,
                                    tierIndex,
                                    data,
                                  )
                                }
                                onSubmit={() => {}}
                                idPrefix={`g${groupIndex}t${ticketIndex}p${tierIndex}`}
                              />
                            </div>
                            {ticket.priceTiers.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeTier(groupIndex, ticketIndex, tierIndex)
                                }
                                className="mt-7 text-red-400 text-xs hover:text-red-300 shrink-0"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addTier(groupIndex, ticketIndex)}
                        className="text-xs text-gold/70 hover:text-gold secondary"
                      >
                        + Add tier
                      </button>
                    </div>
                  </div>
                ))}

                <Button
                  text="+ Add Ticket"
                  size="small"
                  onClick={() => addTicket(groupIndex)}
                />
              </div>
            </div>
          ))}

          {/* Empty slots — big add-group cards */}
          {Array.from({ length: emptySlotsCount }).map((_, slotIndex) => (
            <button
              key={`add-slot-${slotIndex}`}
              type="button"
              onClick={addGroup}
              className="h-64 w-full border-2 border-dashed border-gold/20 bg-stone-950 hover:border-gold/50 hover:bg-stone-900 transition-colors duration-300 flex flex-col items-center justify-center gap-3 text-gold/40 hover:text-gold/70"
            >
              <FaPlus size={32} />
              <span className="text-sm secondary uppercase tracking-wider">
                Add Ticket Group
              </span>
            </button>
          ))}
        </div>

        {/* Below-grid add button — only when every slot in the row is filled */}
        {showAddGroupBelow && (
          <Button text="+ Add Ticket Group" size="small" onClick={addGroup} />
        )}

        {/* Save */}
        <div className="flex justify-end pt-4 border-t border-gold/20">
          <Button
            text={isSaving ? "Saving..." : "Save Tickets"}
            onClick={handleSave}
            loading={isSaving}
            disabled={!canSubmit || isSaving}
          />
        </div>
      </div>
    </SectionContainer>
  );
};

export default CreateTicketsForm;
