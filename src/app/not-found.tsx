export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
        <a href="/" className="text-primary hover:underline">Go back home</a>
      </div>
    </div>
  );
}