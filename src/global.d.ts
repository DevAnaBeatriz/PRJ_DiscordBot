declare module 'spotify-url-info' {
    import { Agent } from 'http';
    import { RequestInit } from 'node-fetch';
  
    export interface SpotifyArtist {
      name: string;
    }
  
    export interface SpotifyTrack {
      type: 'track';
      name: string;
      artists: SpotifyArtist[];
      external_urls: {
        spotify: string;
      };
    }
  
    export interface SpotifyPlaylist {
      type: 'playlist';
      name: string;
      tracks: {
        items: { track: SpotifyTrack }[];
      };
      external_urls: {
        spotify: string;
      };
    }
  
    export interface SpotifyAlbum {
      type: 'album';
      name: string;
      artists: SpotifyArtist[];
      tracks: {
        items: SpotifyTrack[];
      };
      external_urls: {
        spotify: string;
      };
    }
  
    export type SpotifyData = SpotifyTrack | SpotifyPlaylist | SpotifyAlbum;
  
    export function getData(
      url: string,
      fetchOptions?: RequestInit & { agent?: Agent }
    ): Promise<SpotifyData>;
  }
  