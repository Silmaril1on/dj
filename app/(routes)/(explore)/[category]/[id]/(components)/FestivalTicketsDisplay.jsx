"use client";
import { useEffect, useState } from "react";
import Spinner from "@/app/components/ui/Spinner";
import SectionContainer from "@/app/components/containers/SectionContainer";
import Button from "@/app/components/buttons/Button";
import { MdKeyboardArrowDown } from "react-icons/md";
import { capitalizeFirst } from "@/app/helpers/utils";

const statusDotClass = {
  in_stock: "bg-green-500",
  sold_out: "bg-red-500",
};

const statusLabel = {
  in_stock: "In stock",
  sold_out: "Sold out",
};

const formatPrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(price);
};

const TicketsDisplay = ({ entityType, entityId }) => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [ticketLink, setTicketLink] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !(prev[groupKey] ?? false),
    }));
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const apiUrl =
          entityType === "festivals"
            ? `/api/festivals/tickets?festival_id=${entityId}`
            : `/api/events/tickets?event_id=${entityId}`;
        const response = await fetch(apiUrl, { cache: "no-store" });

        if (!response.ok) {
          setGroups([]);
          return;
        }

        const json = await response.json();
        setGroups(Array.isArray(json.ticket_groups) ? json.ticket_groups : []);
        setTicketLink(json?.ticket_link || "");
      } catch {
        setGroups([]);
        setTicketLink("");
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      fetchTickets();
    }
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className="center py-10">
        <Spinner />
      </div>
    );
  }

  if (!groups.length) {
    return null;
  }

  return (
    <SectionContainer
      title="Tickets"
      description={`Explore the available ticket options for this ${entityType === "festivals" ? "festival" : "event"}.`}
      className="my-7"
    >
      <div className="flex flex-col w-full space-y-5">
        {groups.map((group, groupIndex) => {
          const groupKey = `${group.title}-${groupIndex}`;
          const isCollapsed = Boolean(collapsedGroups[groupKey]);

          return (
            <section
              key={groupKey}
              className="space-y-2 w-full lg:w-[75%] mx-auto"
            >
              <button
                type="button"
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between gap-3 text-left"
                aria-expanded={!isCollapsed}
                aria-label={`Toggle ${group.title} tickets`}
              >
                <h3 className="uppercase text-xl font-bold text-gold">
                  {group.title}
                </h3>
                <MdKeyboardArrowDown
                  className={`text-gold cursor-pointer text-3xl transition-transform duration-300 ${
                    isCollapsed ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {!isCollapsed && (
                <div className="space-y-3 ">
                  {(group.tickets || []).map((ticket, ticketIndex) => {
                    const purchaseLink =
                      ticket?.ticket_link || ticketLink || "";
                    const allSoldOut =
                      (ticket?.priceTiers || []).length > 0 &&
                      (ticket?.priceTiers || []).every(
                        (t) => t.stock === false,
                      );
                    const currentStatus = allSoldOut ? "sold_out" : "in_stock";

                    return (
                      <article
                        key={`${ticket.title}-${ticketIndex}`}
                        className="border border-gold/30 bg-stone-900"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_130px]">
                          <div className="p-3 lg:p-4 space-y-5">
                            <div>
                              <h4 className="uppercase font-bold text-lg text-cream">
                                {ticket.title}
                              </h4>

                              {!!ticket?.ticket_info && (
                                <p className=" text-cream/90 mt-1 text-sm">
                                  {capitalizeFirst(ticket.ticket_info)}
                                </p>
                              )}

                              {!!ticket?.extraInfo?.length && (
                                <ul
                                  className={`text-xs text-chino secondary font-light mt-2 list-disc ml-5`}
                                >
                                  {ticket.extraInfo.map((item, infoIndex) => (
                                    <li key={`${item}-${infoIndex}`}>
                                      {capitalizeFirst(item)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {!!ticket?.priceTiers?.length && (
                              <div className="flex flex-wrap gap-2">
                                {ticket.priceTiers.map((tier, tierIndex) =>
                                  (() => {
                                    const isInStock = tier?.stock !== false;
                                    return (
                                      <div
                                        key={`${tier.label}-${tierIndex}`}
                                        className={`min-w-24 px-3 py-2 border relative ${
                                          isInStock
                                            ? "border-green-500 bg-green-500/20"
                                            : "border-red-800 bg-red-800/30 opacity-50"
                                        }`}
                                      >
                                        <p className="text-[11px] uppercase text-cream/70">
                                          {tier.label}
                                        </p>
                                        <p className="font-semibold text-sm text-cream">
                                          {formatPrice(tier.price)}
                                        </p>
                                        {!isInStock && (
                                          <p className="text-[8px] text-red-500 absolute right-1 bottom-0.5 font-bold">
                                            SOLD OUT
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })(),
                                )}
                              </div>
                            )}
                          </div>

                          <div className="border-t lg:border-t-0 lg:border-l border-gold/20 p-3 lg:p-4 flex flex-col justify-start items-end gap-1">
                            <div className="text-right">
                              <p className="font-bold text-2xl text-cream">
                                {formatPrice(
                                  (ticket?.priceTiers || []).reduce(
                                    (max, tier) =>
                                      Number(tier.price) > max
                                        ? Number(tier.price)
                                        : max,
                                    0,
                                  ),
                                )}
                              </p>
                              <div className=" flex items-center justify-end gap-2 text-xs text-cream/90">
                                <span
                                  className={`h-2 w-2 rounded-full ${statusDotClass[currentStatus]}`}
                                />
                                <span>{statusLabel[currentStatus]}</span>
                              </div>
                            </div>

                            <Button
                              href={purchaseLink || undefined}
                              target="_blank"
                              size="small"
                              text={allSoldOut ? "Sold Out" : "Buy Now"}
                              className="w-fit"
                              disabled={allSoldOut}
                            />

                            <div className="text-right text-xs text-cream/70">
                              max {ticket?.maxPerOrder || 1}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </SectionContainer>
  );
};

export default TicketsDisplay;
