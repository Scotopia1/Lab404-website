import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Import, History, BarChart3, Layers } from 'lucide-react';
import AlibabaImportPreview from '@/components/AlibabaImportPreview';
import AlibabaImportHistory from '@/components/AlibabaImportHistory';
import AlibabaBatchImporter from '@/components/AlibabaBatchImporter';
import AlibabaImportStats from '@/components/AlibabaImportStats';

const AlibabaImport = () => {
  const [activeTab, setActiveTab] = useState('import');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Alibaba Product Import Center
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Import products directly from Alibaba with intelligent parsing, preview capabilities,
            and batch processing for efficient catalog management.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Import className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Batch Import
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Single Product Import */}
          <TabsContent value="import" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Import className="h-5 w-5" />
                  Single Product Import
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlibabaImportPreview />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batch Import */}
          <TabsContent value="batch" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Batch Import
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlibabaBatchImporter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import History */}
          <TabsContent value="history" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Import History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlibabaImportHistory />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="stats" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Import Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlibabaImportStats />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AlibabaImport;