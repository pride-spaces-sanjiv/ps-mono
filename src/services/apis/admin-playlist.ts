import { ADMIN_PLAYLIST } from "./config";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { parsePlaylistSchema } from "@/utils/schemas/playlist";
import type { GeneralResponseWithError } from "@/types/axios/response";
import type { PlaylistChannel } from "@/types/data/media";

export type ParsedPlaylistInfo = {
  channels: PlaylistChannel[];
  groups: string[];
  epg: string | undefined;
};

export type ParsedPlaylistInfoRes =
  GeneralResponseWithError<ParsedPlaylistInfo>;

export const parsePlaylist = APIBodyValidationWrapper({
  schema: parsePlaylistSchema,
  handle: async (param, config) => {
    const url = "/parse";
    const res = await ADMIN_PLAYLIST.post<ParsedPlaylistInfoRes>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});
