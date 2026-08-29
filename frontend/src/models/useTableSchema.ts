import { useQuery } from "@tanstack/react-query";
import { fetchTableSchema } from "@/models/tableSchema";
import { tableSchemaKey } from "@/models/queryKeys";

export function useTableSchema(resource: string, league: string) {
  return useQuery({
    queryKey: tableSchemaKey(resource, league),
    queryFn: () => fetchTableSchema(resource, league === "" ? "" : `league=${league}`),
  });
}
