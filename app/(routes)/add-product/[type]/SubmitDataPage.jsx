"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import { showSuccess } from "@/app/features/successSlice";
import { selectUser } from "@/app/features/userSlice";
import SubmissionForm from "@/app/components/forms/SubmissionForm";
import FormContainer from "@/app/components/forms/FormContainer";
import TermsAndConditions from "@/app/components/materials/TermsAndConditions";
import ErrorCode from "@/app/components/ui/ErrorCode";
import Spinner from "@/app/components/ui/Spinner";
import { DATA_TYPE_CONFIGS, getFormConfig } from "./dataTypeConfigs";

const SubmitDataPage = ({ type }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const config = DATA_TYPE_CONFIGS[type];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [entityData, setEntityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prefill, setPrefill] = useState({});

  // Parse URL params for edit mode and prefill data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const edit = urlParams.get("edit");
    const entityId = urlParams.get(config.idParam);

    if (edit === "true" && entityId && config.api.fetch) {
      setIsEditMode(true);
      fetchEntityData(entityId);
    }

    // Read prefill params from URL (e.g., event prefill from club page)
    if (config.prefillParams) {
      const prefillData = {};
      config.prefillParams.forEach((param) => {
        const value = urlParams.get(param);
        if (value) prefillData[param] = value;
      });
      setPrefill(prefillData);
    }
  }, [type]);

  const fetchEntityData = async (entityId) => {
    setLoading(true);
    try {
      const response = await fetch(config.api.fetch(entityId));
      if (response.ok) {
        const data = await response.json();
        setEntityData(config.extractData(data));
      } else {
        dispatch(
          setError({
            message: `Failed to fetch ${type} data`,
            type: "error",
          }),
        );
      }
    } catch {
      dispatch(
        setError({
          message: `Error fetching ${type} data`,
          type: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const formConfig = useMemo(
    () =>
      getFormConfig(
        type,
        isEditMode && entityData ? entityData : null,
        prefill,
      ),
    [type, isEditMode, entityData, prefill],
  );

  const handleSubmit = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      dispatch(setError(""));

      try {
        const url = isEditMode ? config.api.update : config.api.submit;
        const method = isEditMode ? "PATCH" : "POST";

        // Append entity ID for edit mode
        if (isEditMode && entityData) {
          formData.append(config.idParam, entityData.id);
        }

        // Run any type-specific pre-submit transformations
        config.beforeSubmit?.(formData);

        const response = await fetch(url, { method, body: formData });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Failed to ${isEditMode ? "update" : "submit"} ${type}`,
          );
        }

        const result = await response.json();

        if (isEditMode) {
          dispatch(
            setError({
              message: "You updated info successfully",
              type: "success",
            }),
          );
        } else {
          dispatch(showSuccess(config.mapSuccessPayload(result)));
        }
      } catch (err) {
        dispatch(setError({ message: err.message, type: "error" }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEditMode, entityData, config, type, dispatch],
  );

  // Check submission guard (e.g., user already submitted an artist)
  const isGuarded =
    config.submissionGuard &&
    !isEditMode &&
    user?.[config.submissionGuard.field] &&
    !(config.submissionGuard.adminBypass && user?.is_admin);

  const mode = isEditMode ? "edit" : "add";

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {isGuarded ? (
        <div className="flex-1 w-full h-98 center">
          <ErrorCode
            title={config.submissionGuard.title}
            description={config.submissionGuard.description}
          />
        </div>
      ) : (
        <div className="flex-1 w-full">
          <FormContainer
            className="w-full"
            title={config.title[mode]}
            description={config.description[mode]}
          >
            {loading ? (
              <Spinner />
            ) : (
              <SubmissionForm
                showGoogle={false}
                formConfig={formConfig}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                submitButtonText={config.submitText[mode]}
              />
            )}
          </FormContainer>
        </div>
      )}
      <div className="w-full lg:w-[35%] lg:min-w-[400px]">
        <TermsAndConditions type={config.termsType} />
      </div>
    </div>
  );
};

export default SubmitDataPage;
