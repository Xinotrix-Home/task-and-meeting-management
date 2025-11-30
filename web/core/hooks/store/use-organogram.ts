import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import { OrganogramStore } from "@/store/organogram/organogram.store";

export const useOrganogram = (): OrganogramStore => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useOrganogram must be used within a StoreProvider");
  }
  return context.organogram as OrganogramStore;
};

