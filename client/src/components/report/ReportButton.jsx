import { useState } from "react";
import { Flag } from "lucide-react";
import Button from "../ui/Button";
import ReportModal from "./ReportModal";

/**
 * ReportButton - Trigger button to open report modal
 * @param {string} tripId - ID of the trip to report
 * @param {string} tripTitle - Title of the trip being reported
 * @param {string} variant - Button style variant
 * @param {string} size - Button size
 */
const ReportButton = ({
  tripId,
  tripTitle,
  variant = "ghost",
  size = "sm",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={(e) => {
          e.stopPropagation(); // Prevent parent click handlers
          setIsModalOpen(true);
        }}
        className='gap-2'
      >
        <Flag className='w-4 h-4' />
        Report
      </Button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tripId={tripId}
        tripTitle={tripTitle}
      />
    </>
  );
};

export default ReportButton;
