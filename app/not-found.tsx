import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-900/50 border-slate-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-orange-500/10 rounded-full">
              <Flame className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">404 - Lost in Space</CardTitle>
          <p className="text-slate-400 mt-2">
            This startup idea doesn&apos;t exist. Time to pivot!
          </p>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus-visible:ring-2 focus-visible:ring-orange-500">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
