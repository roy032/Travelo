# Loading States and Error Handling Guide

This guide demonstrates how to use the loading and error handling utilities in the application.

## Error Handling

### Using ErrorBoundary

The ErrorBoundary component catches React component errors and displays a fallback UI:

```jsx
import { ErrorBoundary } from './components';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Using useErrorHandler Hook

```jsx
import { useErrorHandler } from './hooks/useErrorHandler';

function MyComponent() {
  const { handleError, handleSuccess } = useErrorHandler();

  const handleSubmit = async () => {
    try {
      await api.createTrip(data);
      handleSuccess('Trip created successfully!');
    } catch (error) {
      handleError(error);
    }
  };
}
```

### Using Toast Messages

```jsx
import toast from 'react-hot-toast';
import { successMessages, errorMessages } from './utils/toast.config';

// Success message
toast.success(successMessages.created);

// Error message
toast.error(errorMessages.network);

// Custom message
toast.success('Your custom message');
```

## Loading States

### Using useLoading Hook

```jsx
import { useLoading } from './hooks/useLoading';

function MyComponent() {
  const { isLoading, executeAsync } = useLoading();

  const fetchData = async () => {
    await executeAsync(
      async () => {
        const data = await api.getData();
        return data;
      },
      {
        onSuccess: (data) => console.log('Success:', data),
        onError: (error) => console.error('Error:', error),
      }
    );
  };

  return (
    <div>
      {isLoading ? <Loader /> : <DataDisplay />}
    </div>
  );
}
```

### Using useAsync Hook

```jsx
import { useAsync } from './hooks/useAsync';

function MyComponent() {
  const { execute, isPending, data, isError } = useAsync(
    () => api.getTrips(),
    true // Execute immediately on mount
  );

  if (isPending) return <Loader />;
  if (isError) return <div>Error loading data</div>;

  return <div>{/* Render data */}</div>;
}
```

### Using LoadingButton

```jsx
import { LoadingButton } from './components';

function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.submitForm(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoadingButton
      isLoading={isSubmitting}
      loadingText="Submitting..."
      onClick={handleSubmit}
    >
      Submit
    </LoadingButton>
  );
}
```

### Using LoadingOverlay

```jsx
import { LoadingOverlay } from './components';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="relative">
      <LoadingOverlay isLoading={isLoading} message="Loading data...">
        <YourContent />
      </LoadingOverlay>
    </div>
  );
}
```

### Using Skeleton Loaders

```jsx
import { SkeletonCard, SkeletonList, SkeletonTripGrid } from './components';

function MyComponent() {
  const { isPending, data } = useAsync(() => api.getTrips(), true);

  if (isPending) {
    return <SkeletonTripGrid count={6} />;
  }

  return <TripGrid trips={data} />;
}
```

### Using Empty States

```jsx
import { EmptyTrips, EmptyState } from './components';

function TripList() {
  const trips = useTrips();

  if (trips.length === 0) {
    return <EmptyTrips onCreateTrip={handleCreateTrip} />;
  }

  return <div>{/* Render trips */}</div>;
}

// Custom empty state
function CustomEmpty() {
  return (
    <EmptyState
      icon="🎉"
      title="Custom Title"
      message="Custom message"
      actionLabel="Take Action"
      onAction={handleAction}
    />
  );
}
```

## Complete Example

Here's a complete example combining all patterns:

```jsx
import { useState } from 'react';
import { useAsync } from './hooks/useAsync';
import { useErrorHandler } from './hooks/useErrorHandler';
import {
  LoadingButton,
  SkeletonCard,
  EmptyTrips,
  ErrorBoundary,
} from './components';
import { tripApi } from './services/api.service';

function TripListPage() {
  const { handleSuccess } = useErrorHandler();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch trips with loading state
  const { isPending, data: trips, execute: refetchTrips } = useAsync(
    () => tripApi.getUserTrips(),
    true // Execute on mount
  );

  const handleCreateTrip = async (tripData) => {
    setIsCreating(true);
    try {
      await tripApi.createTrip(tripData);
      handleSuccess('Trip created successfully!');
      refetchTrips(); // Refresh the list
    } catch (error) {
      // Error is automatically handled by API service
    } finally {
      setIsCreating(false);
    }
  };

  // Show skeleton while loading
  if (isPending) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no trips
  if (trips?.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <EmptyTrips onCreateTrip={() => setShowCreateModal(true)} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Trips</h1>
          <LoadingButton
            isLoading={isCreating}
            loadingText="Creating..."
            onClick={() => setShowCreateModal(true)}
          >
            Create Trip
          </LoadingButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip._id} trip={trip} />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default TripListPage;
```

## Best Practices

1. **Always show loading states** for async operations that take more than 200ms
2. **Use skeleton loaders** instead of spinners for better perceived performance
3. **Provide empty states** with clear actions when there's no data
4. **Handle errors gracefully** with user-friendly messages
5. **Disable buttons** during async operations to prevent duplicate submissions
6. **Use ErrorBoundary** at the app level and around critical sections
7. **Provide feedback** for all user actions (success/error messages)
8. **Keep loading messages** descriptive and contextual
9. **Use appropriate loader sizes** based on the context (sm for buttons, lg for pages)
10. **Test error scenarios** to ensure proper error handling
