"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import ProductCard from "@/app/components/containers/ProductCard";
import SectionContainer from "@/app/components/containers/SectionContainer";
import Spinner from "@/app/components/ui/Spinner";
import Swiper from "@/app/components/containers/Swiper";

const MyRecentlyViews = () => {
  const user = useSelector(selectUser);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchRecentlyViewed = async () => {
      try {
        const response = await fetch(`/api/recently-viewed?user_id=${user.id}`);
        const result = await response.json();

        if (response.ok && result.data) {
          setRecentItems(result.data);
        }
      } catch (error) {
        console.error("Error fetching recently viewed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, [user?.id]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <SectionContainer
        title="Recently Viewed"
        description="Your recently browsed items"
        className="bg-stone-900"
      >
        <Spinner />
      </SectionContainer>
    );
  }

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <SectionContainer
      title="Recently Viewed"
      description="Your recently browsed items"
      className="bg-stone-950"
    >
      {/* Desktop Grid */}
      <div className="hidden lg:grid lg:grid-cols-6 gap-4 w-full">
        {recentItems.map((item, index) => (
          <ProductCard
            key={item.id}
            id={item.id}
            name={item.name}
            image={item.image}
            href={item.href}
            artists={item.artists || []}
            date={item.date}
            animation="fade"
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Mobile Swiper */}
      <Swiper cardWidth={160} spacing={12}>
        {recentItems.map((item, index) => (
          <div key={item.id} className="h-full *:h-full">
            <ProductCard
              id={item.id}
              name={item.name}
              image={item.image}
              href={item.href}
              artists={item.artists || []}
              date={item.date}
              animation="fade"
              delay={index * 0.05}
            />
          </div>
        ))}
      </Swiper>
    </SectionContainer>
  );
};

export default MyRecentlyViews;
